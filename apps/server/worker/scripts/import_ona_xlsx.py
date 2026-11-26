"""Import rows from a generated ONA Excel template as form submissions."""

import json
import re
import sys
import uuid
from datetime import date, datetime
from io import BytesIO
from typing import NoReturn

import requests
from openpyxl import load_workbook
from openpyxl.workbook.workbook import Workbook
from ona_xlsform import is_relevant, parse_xlsform

MAX_ROWS = 1000
MAX_FIELDS = 500
MAX_ERRORS = 100


def fail(message: str) -> NoReturn:
    print(json.dumps({"error": message}), flush=True)
    sys.exit(1)


def field_path(header):
    path = [part.strip() for part in str(header).strip().strip("/").split("/")]
    if path and path[0] == "data":
        path = path[1:]
    if not path or any(not part for part in path):
        raise ValueError(f"Invalid field name: {header}")
    return path


def set_field(target, path, value):
    for part in path[:-1]:
        existing = target.setdefault(part, {})
        if not isinstance(existing, dict):
            raise ValueError(f"Conflicting field paths at {part}")
        target = existing

    field = path[-1]
    if field in target:
        raise ValueError(f"Conflicting field paths at {field}")
    target[field] = value


def cell_value(value, hint):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return None

    normalized_hint = str(hint or "").lower()
    if "select_multiple" in normalized_hint:
        if isinstance(value, str):
            return [item for item in re.split(r"[\s,;]+", value) if item]
        if isinstance(value, (list, tuple)):
            return list(value)
    if "boolean" in normalized_hint:
        if isinstance(value, bool):
            return value
        normalized_value = str(value).strip().lower()
        if normalized_value in {"true", "yes", "1"}:
            return True
        if normalized_value in {"false", "no", "0"}:
            return False
    return value


def main():
    if len(sys.argv) != 4:
        fail("Invalid importer configuration")

    api_key, base_url, form_id = sys.argv[1:]
    workbook: Workbook | None = None
    try:
        workbook = load_workbook(
            BytesIO(sys.stdin.buffer.read()), read_only=True, data_only=True
        )
    except Exception:
        fail("The uploaded file is not a readable XLSX workbook")

    if workbook is None:
        fail("The uploaded file is not a readable XLSX workbook")

    try:
        sheet = workbook.active
        if sheet is None:
            fail("The workbook does not contain an active worksheet")
        rows = sheet.iter_rows(values_only=True)
        headers = next(rows, None)
        if headers is None:
            fail("The workbook is missing its header row")
        if len(headers) > MAX_FIELDS:
            fail(f"An upload can contain at most {MAX_FIELDS} form fields")

        columns = []
        option_maps = {}
        if "_ONA_Metadata" in workbook.sheetnames:
            metadata_sheet = workbook["_ONA_Metadata"]
            seen = set()
            for column_index, path_value, options_json in metadata_sheet.iter_rows(
                min_col=1, max_col=3, values_only=True
            ):
                if column_index is None or path_value is None:
                    continue
                try:
                    path = field_path(path_value)
                    option_maps[int(column_index) - 1] = json.loads(options_json or "{}")
                except (ValueError, TypeError, json.JSONDecodeError):
                    fail("The workbook contains invalid ONA template metadata")
                canonical_name = "/".join(path)
                if canonical_name in seen:
                    fail(f"Duplicate field name in template: {canonical_name}")
                seen.add(canonical_name)
                columns.append((int(column_index) - 1, path, ""))
            data_start_row = 2
        else:
            # Continue accepting workbooks downloaded before the new template format.
            hints = next(rows, None)
            if hints is None:
                fail("The workbook is missing its field hints row")
            seen = set()
            for index, header in enumerate(headers):
                if header is None or not str(header).strip():
                    continue
                name = str(header).strip()
                if name in seen:
                    fail(f"Duplicate field name in template: {name}")
                seen.add(name)
                try:
                    path = field_path(name)
                except ValueError as error:
                    fail(str(error))
                columns.append((index, path, str(hints[index] if index < len(hints) else "")))
            data_start_row = 3

        if not columns:
            fail("No form fields were found in the workbook")

        data_rows = []
        for row_number, row in enumerate(rows, start=data_start_row):
            if row is None:
                continue
            if len(row) > MAX_FIELDS:
                fail(f"An upload can contain at most {MAX_FIELDS} form fields")
            if not row or not any(
                value is not None and str(value).strip() for value in row
            ):
                continue
            data_rows.append((row_number, row))
            if len(data_rows) > MAX_ROWS:
                fail(f"An upload can contain at most {MAX_ROWS} data rows")
        if not data_rows:
            fail("The workbook does not contain any data rows")

        try:
            form_response = requests.get(
                f"{base_url.rstrip('/')}/forms/{form_id}",
                headers={"Authorization": f"Token {api_key}"},
                timeout=30,
            )
            form_response.raise_for_status()
            form = form_response.json()
            definition_response = requests.get(
                f"{base_url.rstrip('/')}/forms/{form_id}/form.xls",
                headers={"Authorization": f"Token {api_key}"},
                timeout=30,
            )
            definition_response.raise_for_status()
            form_definition = definition_response.content
        except requests.RequestException as error:
            fail(f"Could not load form details from ONA: {error}")
        except ValueError:
            fail("ONA returned invalid form details")

        try:
            parsed_fields = parse_xlsform(form_definition)
            fields = {field["path"]: field for field in parsed_fields}
        except (AttributeError, TypeError, ValueError):
            fail("ONA returned an invalid form definition")
        form_name = form.get("id_string")
        if not form_name:
            fail("ONA form details did not include an id_string")

        unknown_fields = [
            "/".join(path) for _, path, _ in columns if "/".join(path) not in fields
        ]
        if unknown_fields:
            fail("Workbook contains fields that do not belong to this form: " + ", ".join(unknown_fields[:20]))

        imported = 0
        failed = 0
        errors = []

        for row_number, row in data_rows:
            submission = {"meta": {"instanceID": f"uuid:{uuid.uuid4()}"}}
            missing = []
            try:
                for index, path, workbook_hint in columns:
                    metadata = fields["/".join(path)]
                    raw_value = row[index] if index < len(row) else None
                    option_map = option_maps.get(index, {})
                    if isinstance(raw_value, str) and option_map:
                        raw_value = raw_value.strip()
                        if raw_value in option_map:
                            raw_value = option_map[raw_value]
                        elif metadata["type"] == "select_multiple":
                            tokens = re.split(r"[\s,;]+", raw_value)
                            raw_value = [option_map.get(token, token) for token in tokens if token]
                    value = cell_value(
                        raw_value,
                        "Type: select_multiple" if metadata["type"] == "select_multiple" else workbook_hint,
                    )
                    condition_met = is_relevant(metadata["relevant"], submission)
                    if metadata["required"] and condition_met and value is None:
                        missing.append(path[-1])
                    if value is not None:
                        set_field(submission, path, value)
                if missing:
                    raise ValueError(
                        f"Required fields are empty: {', '.join(missing)}"
                    )

                response = requests.post(
                    f"{base_url.rstrip('/')}/submissions",
                    headers={"Authorization": f"Token {api_key}"},
                    json={"id": form_name, "submission": submission},
                    timeout=30,
                )
                response.raise_for_status()
                imported += 1
            except (ValueError, requests.RequestException) as error:
                failed += 1
                if len(errors) < MAX_ERRORS:
                    detail = str(error)
                    if isinstance(error, requests.HTTPError) and error.response is not None:
                        detail = f"ONA returned HTTP {error.response.status_code}: {error.response.text[:300]}"
                    errors.append({"row": row_number, "message": detail[:500]})

        print(
            json.dumps(
                {"imported": imported, "failed": failed, "errors": errors}
            ),
            flush=True,
        )
    finally:
        workbook.close()


if __name__ == "__main__":
    main()

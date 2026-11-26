"""Generate a user-friendly Excel submission template from an ONA form."""

import json
import logging
import sys

import requests
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.worksheet import Worksheet
from openpyxl.workbook.defined_name import DefinedName
from ona_xlsform import fetch_external_csv_choices, parse_xlsform

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)-5s] %(name)s - %(message)s"
)
logger = logging.getLogger("generate_form_template")


def excel_column_letter(column: int) -> str:
    """Convert a one-based column number to its Excel column letters."""
    letters = ""
    while column:
        column, remainder = divmod(column - 1, 26)
        letters = chr(65 + remainder) + letters
    return letters


def log_step(step, status, message=""):
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)


def localized_text(value, language):
    if isinstance(value, dict):
        translations = value
        value = translations.get(language) or translations.get("default")
        if value is None:
            value = next(iter(translations.values()), "")
    return str(value).strip() if value is not None else ""


def is_required(node):
    """Read requiredness from the question or its XForm bind metadata."""
    def enabled(value):
        if isinstance(value, bool):
            return value
        if isinstance(value, dict):
            for key in ("required", "jr:required", "value", "default", "expression"):
                if key in value:
                    return enabled(value[key])
            return any(enabled(item) for item in value.values())
        normalized = str(value or "").strip().lower()
        return normalized not in {
            "", "false", "false()", "0", "no", "none", "null", "optional"
        }

    if "required" in node:
        return enabled(node["required"])

    def find_requirement(value):
        if isinstance(value, dict):
            for key, nested in value.items():
                if key in {"required", "jr:required"}:
                    return enabled(nested)
            for key, nested in value.items():
                if key != "children":
                    found = find_requirement(nested)
                    if found is not None:
                        return found
        elif isinstance(value, list):
            for nested in value:
                found = find_requirement(nested)
                if found is not None:
                    return found
        return None

    found = find_requirement(node)
    if found is not None:
        return found
    return False


def choice_options(children, language):
    """Read ONA's embedded choice nodes across its supported JSON shapes."""
    options = []

    def collect(nodes):
        if isinstance(nodes, dict):
            if any(key in nodes for key in ("name", "value", "children")):
                nodes = [nodes]
            else:
                for value, label in nodes.items():
                    if isinstance(label, dict):
                        label = label.get("label") or label.get("name") or value
                    options.append(
                        (localized_text(label, language) or str(value), str(value))
                    )
                return
        if not isinstance(nodes, list):
            return
        for option in nodes:
            if not isinstance(option, dict):
                continue
            value = option.get("name") or option.get("value")
            if value is not None and str(value).strip():
                value = str(value).strip()
                label = localized_text(option.get("label"), language) or value
                options.append((label, value))
            elif isinstance(option.get("children"), list):
                collect(option["children"])

    collect(children)

    # Keep the first occurrence if ONA exposes the same options through both
    # children and the normalized choices property.
    options = list(dict.fromkeys(options))

    # A dropdown must display unique choices so each selection maps back to one
    # ONA choice value, even when the form has repeated labels.
    labels = [label for label, _ in options]
    return [
        (f"{label} ({value})" if labels.count(label) > 1 else label, value)
        for label, value in options
    ]


def add_dropdown(
    workbook: Workbook,
    sheet: Worksheet,
    choices_sheet: Worksheet,
    column: int,
    options: list[tuple[str, str]],
) -> None:
    if not options:
        return

    choice_column = column
    for row, (label, _value) in enumerate(options, start=1):
        choices_sheet.cell(row=row, column=choice_column, value=label)
    choices_sheet.column_dimensions[excel_column_letter(choice_column)].hidden = True

    # Inline lists are more reliable in Excel for common short option sets.
    # Use a workbook named range for long lists and values Excel cannot safely
    # parse from a comma-separated validation formula.
    inline_values = ",".join(label for label, _value in options)
    if (
        len(inline_values) <= 240
        and all("," not in label and '"' not in label for label, _value in options)
    ):
        formula = '"' + inline_values + '"'
    else:
        range_name = f"ONAChoices{column}"
        letter = excel_column_letter(choice_column)
        workbook.defined_names.add(
            DefinedName(
                range_name,
                attr_text=f"'_ONA_Choices'!${letter}$1:${letter}${len(options)}",
            )
        )
        formula = f"={range_name}"
    validation = DataValidation(type="list", formula1=formula, allow_blank=True)
    # For select_multiple, Excel's native dropdown picks one value at a time;
    # allowing free entry lets users enter several ONA codes separated by spaces.
    validation.showErrorMessage = False
    validation.errorTitle = "Choose a listed option"
    validation.error = "For multiple answers, enter ONA option values separated by spaces."
    sheet.add_data_validation(validation)
    validation.add(
        f"{excel_column_letter(column)}2:{excel_column_letter(column)}1001"
    )


def write_template(fields: list[dict], output_path: str) -> None:
    workbook = Workbook()
    sheet = workbook[workbook.sheetnames[0]]
    sheet.title = "Submissions"
    schema = workbook.create_sheet("_ONA_Metadata")
    choices_sheet = workbook.create_sheet("_ONA_Choices")

    header_fill = PatternFill("solid", fgColor="1F4E78")
    required_header_fill = PatternFill("solid", fgColor="8C3038")
    alternate_fill = PatternFill("solid", fgColor="F2F6FA")
    grid_side = Side(style="thin", color="D6DEE8")
    cell_border = Border(
        left=grid_side,
        right=grid_side,
        top=grid_side,
        bottom=grid_side,
    )
    for column, field in enumerate(fields, start=1):
        status = (
            "Required when applicable"
            if field["required"] and field["relevant"]
            else "Required"
            if field["required"]
            else "Optional"
        )
        header = sheet.cell(
            row=1,
            column=column,
            value=f"{field['label']}\n{status}",
        )
        header.font = Font(color="FFFFFF", bold=True)
        header.fill = required_header_fill if field["required"] else header_fill
        header.alignment = Alignment(wrap_text=True, vertical="center")
        header.border = cell_border
        sheet.column_dimensions[excel_column_letter(column)].width = min(max(len(field["label"]) + 4, 18), 40)

        schema.cell(row=column, column=1, value=column)
        schema.cell(row=column, column=2, value=field["path"])
        schema.cell(row=column, column=3, value=json.dumps({label: value for label, value in field["options"]}, ensure_ascii=False))
        schema.cell(row=column, column=4, value=field["required"])
        schema.cell(row=column, column=5, value=field["relevant"])
        if field["type"] in {"select_one", "select_multiple", "select_all_that_apply"}:
            if field["options"]:
                add_dropdown(workbook, sheet, choices_sheet, column, field["options"])
            else:
                logger.warning(
                    "No choices found for select field %s (%s)",
                    field["label"],
                    field["path"],
                )

        for row in range(2, 1002):
            cell = sheet.cell(row=row, column=column)
            cell.border = cell_border
            if row % 2 == 0:
                cell.fill = alternate_fill
            cell.alignment = Alignment(vertical="top", wrap_text=True)

    sheet.row_dimensions[1].height = 42
    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = f"A1:{excel_column_letter(len(fields))}1001"
    sheet.sheet_view.showGridLines = False
    schema.sheet_state = "hidden"
    choices_sheet.sheet_state = "hidden"
    workbook.save(output_path)


def main():
    logger.info("Starting template generation")
    if len(sys.argv) < 5:
        log_step("error", "failed", "Missing arguments")
        sys.exit(1)

    api_key, base_url, form_id, output_path = sys.argv[1:5]
    log_step("fetch", "running", "Fetching form definition from ONA…")
    headers = {"Authorization": f"Token {api_key}"}
    try:
        response = requests.get(
            f"{base_url.rstrip('/')}/forms/{form_id}/form.xls",
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        external_choices = fetch_external_csv_choices(base_url, api_key, form_id)
        fields = parse_xlsform(response.content, external_choices)
    except requests.RequestException as error:
        logger.exception("Could not fetch the ONA form definition")
        log_step("fetch", "failed", str(error))
        sys.exit(1)
    except (ValueError, OSError) as error:
        logger.exception("ONA returned an invalid XLSForm")
        log_step("fetch", "failed", str(error))
        sys.exit(1)

    if not fields:
        log_step("fetch", "failed", "The ONA form definition contains no importable fields")
        sys.exit(1)

    logger.info("Loaded %s form fields from ONA", len(fields))
    logger.info("Required fields found: %s", sum(field["required"] for field in fields))
    logger.info(
        "External select fields with options: %s",
        sum(
            field["type"] in {"select_one", "select_multiple"} and bool(field["options"])
            for field in fields
        ),
    )
    log_step("fetch", "complete", f"Found {len(fields)} fields")
    log_step("save", "running", "Creating Excel file…")
    write_template(fields, output_path)
    logger.info("Template saved to %s", output_path)
    log_step("save", "complete", output_path)
    logger.info("Template generation completed")


if __name__ == "__main__":
    main()

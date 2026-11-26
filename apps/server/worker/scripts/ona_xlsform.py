"""Helpers for reading ONA's downloadable XLSForm and its conditions."""

import ast
import csv
import io
import re
from collections import defaultdict
from io import BytesIO

import requests
from openpyxl import load_workbook


def cell_text(value):
    return str(value).strip() if value is not None else ""


def truthy(value):
    if isinstance(value, bool):
        return value
    return str(value or "").strip().lower() not in {
        "", "false", "false()", "0", "no", "none", "null", "optional"
    }


def parse_csv_options(content):
    text = content.decode("utf-8-sig") if isinstance(content, bytes) else str(content)
    reader = csv.DictReader(io.StringIO(text))
    options = []
    for row in reader:
        normalized_row = {str(key).strip().lower(): value for key, value in row.items() if key}
        value = cell_text(normalized_row.get("name") or normalized_row.get("value"))
        if not value:
            continue
        label = cell_text(normalized_row.get("label")) or value
        options.append((label, value))
    return unique_options(options)


def unique_options(options):
    options = list(dict.fromkeys(options))
    labels = [label for label, _ in options]
    return [
        (f"{label} ({value})" if labels.count(label) > 1 else label, value)
        for label, value in options
    ]


def parse_xlsform(content, external_choices=None):
    """Extract fields, choices, required flags, and relevant conditions."""
    external_choices = external_choices or {}
    workbook = load_workbook(BytesIO(content), data_only=True, read_only=True)
    try:
        if "survey" not in workbook.sheetnames:
            raise ValueError("ONA XLSForm does not contain a survey sheet")

        survey_rows = workbook["survey"].iter_rows(values_only=True)
        headers = [cell_text(value).lower() for value in next(survey_rows, ())]
        indexes = {name: index for index, name in enumerate(headers) if name}
        if "type" not in indexes or "name" not in indexes:
            raise ValueError("ONA XLSForm survey sheet is missing type or name")

        def value_at(row, name):
            index = indexes.get(name)
            return row[index] if index is not None and index < len(row) else None

        choice_lists = defaultdict(list)
        if "choices" in workbook.sheetnames:
            choices_rows = workbook["choices"].iter_rows(values_only=True)
            choice_headers = [cell_text(value).lower() for value in next(choices_rows, ())]
            choice_indexes = {name: index for index, name in enumerate(choice_headers) if name}
            for row in choices_rows:
                list_name = cell_text(row[choice_indexes["list_name"]]) if "list_name" in choice_indexes and choice_indexes["list_name"] < len(row) else ""
                option_value = cell_text(row[choice_indexes["name"]]) if "name" in choice_indexes and choice_indexes["name"] < len(row) else ""
                option_label = cell_text(row[choice_indexes["label"]]) if "label" in choice_indexes and choice_indexes["label"] < len(row) else option_value
                if list_name and option_value:
                    choice_lists[list_name].append((option_label or option_value, option_value))

        fields = []
        groups = []
        for row in survey_rows:
            type_value = cell_text(value_at(row, "type"))
            type_lower = type_value.lower()
            name = cell_text(value_at(row, "name"))
            label = cell_text(value_at(row, "label")) or name
            relevant = cell_text(value_at(row, "relevant"))

            if type_lower.startswith(("begin group", "begin repeat")):
                if name:
                    groups.append({"name": name, "relevant": relevant})
                continue
            if type_lower.startswith(("end group", "end repeat")):
                if groups:
                    groups.pop()
                continue
            if not name or type_lower in {"note", "calculate", "end"}:
                continue

            field_relevant = [group["relevant"] for group in groups if group["relevant"]]
            if relevant:
                field_relevant.append(relevant)
            condition = " and ".join(f"({item})" for item in field_relevant)
            options = []
            match = re.match(r"^(select_one|select_multiple)(?:_from_file)?\s+(.+)$", type_lower)
            field_type = match.group(1) if match else (type_lower.split()[0] if type_lower else "text")
            if match:
                list_name = match.group(2).strip()
                options = external_choices.get(list_name.lower(), [])
                if not options:
                    options = choice_lists.get(list_name, [])
                options = unique_options(options)

            path = "/".join([group["name"] for group in groups] + [name])
            fields.append({
                "path": path,
                "name": name,
                "label": label,
                "type": field_type,
                "required": truthy(value_at(row, "required")),
                "relevant": condition,
                "options": options,
            })
        return fields
    finally:
        workbook.close()


def fetch_external_csv_choices(base_url, api_key, form_id):
    """Fetch CSV choice files attached to the ONA form as media."""
    response = requests.get(
        f"{base_url.rstrip('/')}/metadata",
        headers={"Authorization": f"Token {api_key}"},
        params={"xform": form_id},
        timeout=30,
    )
    response.raise_for_status()
    choices = {}
    for item in response.json():
        file_name = cell_text(item.get("data_value"))
        file_url = item.get("data_file")
        if item.get("data_type") != "media" or not file_name.lower().endswith(".csv") or not file_url:
            continue
        csv_response = requests.get(file_url, timeout=30)
        csv_response.raise_for_status()
        choices[file_name.lower()] = parse_csv_options(csv_response.content)
    return choices


def get_submission_value(submission, field_name):
    parts = field_name.strip("/").split("/")
    value = submission
    for part in parts:
        if not isinstance(value, dict):
            break
        value = value.get(part)
    if value is not None:
        return value
    if len(parts) == 1:
        def find_leaf(current):
            if isinstance(current, dict):
                if parts[0] in current:
                    return current[parts[0]]
                for nested in current.values():
                    result = find_leaf(nested)
                    if result is not None:
                        return result
            elif isinstance(current, list):
                for nested in current:
                    result = find_leaf(nested)
                    if result is not None:
                        return result
            return None

        return find_leaf(submission)
    return None


def is_relevant(expression, submission):
    """Evaluate the common XPath relevant expressions used by XLSForms."""
    if not expression:
        return True

    source = expression.strip()
    source = re.sub(r"\btrue\(\)", "True", source, flags=re.IGNORECASE)
    source = re.sub(r"\bfalse\(\)", "False", source, flags=re.IGNORECASE)
    source = re.sub(
        r"selected\(\s*\$\{([^}]+)\}\s*,\s*(['\"])(.*?)\2\s*\)",
        lambda match: f"selected({match.group(1).strip()!r}, {match.group(3)!r})",
        source,
        flags=re.IGNORECASE,
    )
    source = re.sub(
        r"\$\{([^}]+)\}",
        lambda match: f"field({match.group(1).strip()!r})",
        source,
    )
    source = re.sub(r"(?<![<>=!])=(?!=)", "==", source)
    source = re.sub(r"\bdiv\b", "/", source, flags=re.IGNORECASE)

    def selected(field_name, expected):
        value = get_submission_value(submission, field_name)
        if isinstance(value, (list, tuple, set)):
            return str(expected) in {str(item) for item in value}
        if value is None:
            return False
        values = re.split(r"[\s,;]+", str(value).strip())
        return str(expected) in values

    def evaluate(node):
        if isinstance(node, ast.Expression):
            return evaluate(node.body)
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            args = [evaluate(arg) for arg in node.args]
            if node.func.id == "field" and len(args) == 1:
                return get_submission_value(submission, str(args[0]))
            if node.func.id == "selected" and len(args) == 2:
                return selected(str(args[0]), str(args[1]))
            raise ValueError("Unsupported relevant expression function")
        if isinstance(node, ast.BoolOp):
            values = [bool(evaluate(value)) for value in node.values]
            return all(values) if isinstance(node.op, ast.And) else any(values)
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
            return not bool(evaluate(node.operand))
        if isinstance(node, ast.Compare):
            left = evaluate(node.left)
            for operator, comparator in zip(node.ops, node.comparators):
                right = evaluate(comparator)
                left_value = "" if left is None else str(left)
                right_value = "" if right is None else str(right)
                if isinstance(operator, ast.Eq):
                    matched = left_value == right_value
                elif isinstance(operator, ast.NotEq):
                    matched = left_value != right_value
                elif isinstance(operator, ast.In):
                    matched = right_value in left_value
                elif isinstance(operator, ast.NotIn):
                    matched = right_value not in left_value
                else:
                    raise ValueError("Unsupported relevant expression comparison")
                if not matched:
                    return False
                left = right
            return True
        if isinstance(node, ast.Name) and node.id in {"True", "False"}:
            return node.id == "True"
        raise ValueError("Unsupported relevant expression")

    try:
        return bool(evaluate(ast.parse(source, mode="eval")))
    except (SyntaxError, ValueError, TypeError):
        # Unknown XLSForm expressions should not reject a row solely because
        # this limited evaluator cannot interpret them.
        return True

"""
B4T Seed System Mapping Pipeline.
Downloads ONA form 881213, cleans it, and replaces the configured Google worksheet.
Usage: python clean_seed_system_mapping.py <api_key> <base_url> <form_id> <sheet_name> <creds_path> <spreadsheet_config_path> <spreadsheet_key>
Optional environment: SEED_FORMAT=long|wide, SEED_CROPS=comma,separated,crops
"""

from __future__ import annotations

import json
import logging
import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Any, cast

import gspread
import pandas as pd
import requests
from google.oauth2.service_account import Credentials
import gspread_dataframe as gd


FORM_ID = "881213"
SHEET_INDEX = 0
FORMAT = os.environ.get("SEED_FORMAT", "long").lower()
CROPS_KEEP = os.environ.get("SEED_CROPS")
COLUMNS_TO_IMPORT: list[str] | None = None
DEDUPE_KEY = "_uuid"

DROP_COLUMNS = {
    "imei", "today", "start", "end", "_id", "id",
    "_parent_table_name", "_parent_index", "_tags", "_notes", "_version",
    "_duration", "_submitted_by", "_last_edited_by", "_xform_id",
    "instance_id", "instance_name",
}
KEEP_META = {"_uuid", "_submission_time"}
VALUE_RENAMES: dict[str, dict[str, str]] = {}

CROPS_CAMEL = [
    "Amaranth", "Banana", "Barley", "BambaraGroundnut", "Beans", "Cassava",
    "Cocoyam", "Chickpea", "Cowpea", "FabaBean", "FingerMillet", "Forages",
    "Grasspea", "Groundnut", "Lentil", "Maize", "Millet", "Okra", "Pigeonpea",
    "Plantain", "Potato", "Rice", "Sesame", "Sorghum", "Soybean",
    "Sweetpotato", "Taro", "Wheat", "Yam", "Other",
]

CROP_FIELDS_CAMEL = [
    "primaryChannel", "primaryPathway", "secondaryChannel", "secondaryPathway",
    "tetiaryChannel", "tetiaryPathway", "scale", "otherScale",
    "primaryTouchpoint", "secondaryTouchpoint", "tetiaryTouchpoint",
    "simpleRating", "otherSimpleRating", "availability", "otherAvailability",
    "privateSector", "otherPrivateSector", "varietalTurnover",
    "otherVarietalTurnover", "supplyConsistency", "otherSupplyConsistency",
    "primaryActivity", "secondaryActivity", "tetiaryActivity",
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-5s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("clean_seed_system_mapping")


def log_step(step: str, status: str, message: str = "") -> None:
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)


def snake(value: str) -> str:
    value = re.sub(r"[^0-9a-zA-Z]+", "_", str(value))
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", value)
    return value.strip("_").lower()


def clean_column(name: str) -> str:
    """Convert ONA/XLSForm paths to stable snake_case field names."""
    if name in KEEP_META:
        return name
    if name.startswith("begin/cropInput"):
        match = re.match(r"begin/cropInput(\w+)/(\w+)", name)
        if match:
            crop, field = match.groups()
            if field.endswith(crop):
                field = field[: -len(crop)]
            return f"{snake(crop)}_{snake(field)}"
    if name.startswith("begin/generalInformation/"):
        return snake(name.split("/", 2)[2])
    if name.startswith("begin/cropGroup/"):
        return "cropgroup_" + snake(name.split("/")[-1])
    if name.startswith("begin/crop/"):
        return "crop_" + snake(name.split("/")[-1])
    if name.startswith("begin/"):
        return snake(name[6:].replace("/", "_"))
    if name.startswith("meta/"):
        meta_name = name[5:]
        normalized_meta = snake(meta_name)
        if meta_name in KEEP_META or normalized_meta == "uuid":
            return "_uuid"
        if normalized_meta == "submission_time":
            return "_submission_time"
        return normalized_meta
    return snake(name)


def to_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("true", "1", "yes", "y")
    if bool(pd.isna(cast(Any, value))):
        return False
    return bool(value)


def crop_multi(value: object) -> list[str]:
    if not isinstance(value, str):
        return []
    return [token for token in re.split(r"[\s,;|]+", value.strip()) if token]


CROP_BLOCK_COLS = {
    f"{snake(crop)}_{snake(field)}"
    for crop in CROPS_CAMEL
    for field in CROP_FIELDS_CAMEL
}

# The B4T worksheet is a reporting table, so expose stable, readable headers
# in this order regardless of the underlying XLSForm paths.
OUTPUT_COLUMNS = [
    ("Index", ("index", "_index")),
    ("Gender", ("gender",)),
    ("Organization", ("organization",)),
    ("Organization City", ("organization_city", "organization_location", "city")),
    ("Region", ("region",)),
    ("Subregion", ("subregion", "sub_region")),
    ("Country", ("country",)),
    ("Location", ("location", "geo_location", "gps_location")),
    ("Crop Group", ("crop_group", "cropgroup")),
    ("Crop", ("crop",)),
    ("Primary Channel", ("primary_channel",)),
    ("Primary Pathway", ("primary_pathway",)),
    ("Secondary Channel", ("secondary_channel",)),
    ("Secondary Pathway", ("secondary_pathway",)),
    ("Tertiary Channel", ("tetiary_channel", "tertiary_channel")),
    ("Tertiary Pathway", ("tetiary_pathway", "tertiary_pathway")),
    ("Scale", ("scale",)),
    ("Primary Touchpoint", ("primary_touchpoint",)),
    ("Secondary Touchpoint", ("secondary_touchpoint",)),
    ("Tertiary Touchpoint", ("tetiary_touchpoint", "tertiary_touchpoint")),
    ("Simple Rating", ("simple_rating",)),
    ("Availability", ("availability",)),
    ("Private Sector", ("private_sector",)),
    ("Varietal Turnover", ("varietal_turnover",)),
    ("Supply Consistency", ("supply_consistency",)),
    ("Primary Activity", ("primary_activity",)),
    ("Secondary Activity", ("secondary_activity",)),
    ("Tertiary Activity", ("tetiary_activity", "tertiary_activity")),
]

ACRONYMS = {
    "ngo": "NGO",
    "ngos": "NGOs",
    "iita": "IITA",
    "iraf": "IRAF",
    "inera": "INERA",
    "isabu": "ISABU",
    "odk": "ODK",
    "ona": "ONA",
    "rtb": "RTB",
}
LOWERCASE_PARTICLES = {
    "a", "an", "and", "de", "des", "du", "of", "the", "in", "on", "for",
}
ORGANIZATION_ACRONYMS = {
    "abu", "arc", "bari", "cip", "csir", "drc", "eiar", "fcri", "fpo",
    "iar", "iarc", "ier", "iiam", "iita", "inera", "inram", "irad",
    "iraf", "isabu", "isra", "kalro", "nacgrab", "nars", "nihort",
    "prsc", "sari", "tari", "ycda",
}


def humanize_value(value: object) -> object:
    """Make machine-style choice values readable without changing normal prose."""
    if not isinstance(value, str) or not value.strip():
        return value
    text = value.strip()
    if text.lower() in ACRONYMS:
        return ACRONYMS[text.lower()]

    # Split camelCase/PascalCase and underscore-delimited choice values.
    readable = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text)
    readable = re.sub(r"([A-Z])([A-Z][a-z])", r"\1 \2", readable)
    readable = re.sub(r"[_-]+", " ", readable)
    if readable == text and " " in text and not text.islower():
        return text

    words = readable.split()
    formatted = []
    for position, word in enumerate(words):
        acronym = ACRONYMS.get(word.lower())
        if acronym:
            formatted.append(acronym)
        elif word.isupper() and len(word) > 1:
            formatted.append(word)
        elif position and word.lower() in LOWERCASE_PARTICLES:
            formatted.append(word.lower())
        else:
            formatted.append(word[:1].upper() + word[1:].lower())
    return " ".join(formatted)


def normalize_organization(value: object) -> object:
    """Apply consistent proper case while retaining organization acronyms."""
    if not isinstance(value, str) or not value.strip():
        return value
    text = value.strip()
    for malformed, corrected in {
        "Ã¨": "è",
        "Ã©": "é",
        "Ã‰": "É",
        "Ã´": "ô",
    }.items():
        text = text.replace(malformed, corrected)
    text = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text)
    text = re.sub(r"([A-Z])([A-Z][a-z])", r"\1 \2", text)
    tokens = re.split(r"(\W+)", text)
    word_position = 0
    normalized: list[str] = []
    for token in tokens:
        if not token or not re.search(r"[A-Za-zÀ-ÖØ-öø-ÿ]", token):
            normalized.append(token)
            continue
        key = token.casefold()
        if key in ORGANIZATION_ACRONYMS:
            normalized.append(token.upper())
        elif word_position and key in LOWERCASE_PARTICLES:
            normalized.append(token.lower())
        else:
            normalized.append(token[:1].upper() + token[1:].lower())
        word_position += 1
    return "".join(normalized)


def selected_crops(row: pd.Series) -> list[str]:
    picked = [crop for crop in CROPS_CAMEL if to_bool(row.get(f"crop_{snake(crop)}"))]
    if not picked:
        crop_value = row.get("crop")
        for token in crop_multi(crop_value):
            picked.extend(crop for crop in CROPS_CAMEL if snake(crop) == snake(token))
    return list(dict.fromkeys(picked))


def selected_crop_groups(row: pd.Series, flag_columns: list[str]) -> str:
    """Read selected crop groups from ONA's delimited value or boolean flags."""
    selected = [
        column.removeprefix("cropgroup_")
        for column in flag_columns
        if to_bool(row.get(column))
    ]
    if not selected:
        selected = [snake(group) for group in crop_multi(row.get("crop_group"))]

    labels = []
    for group in selected:
        key = snake(group)
        if key == "rtb":
            label = "RTB"
        elif key in {"veggie", "vegetable", "vegetables"}:
            label = "Veggie"
        else:
            label = humanize_value(group)
        if label and label not in labels:
            labels.append(str(label))
    return ", ".join(labels)


def to_long(frame: pd.DataFrame) -> pd.DataFrame:
    base_columns = [
        column for column in frame.columns
        if column not in CROP_BLOCK_COLS
        and not column.startswith("cropinput_")
        and not column.startswith("cropgroup_")
        and column != "_selected_crops"
    ]
    records: list[dict[str, object]] = []
    for _, row in frame.iterrows():
        for crop in row["_selected_crops"]:
            record = {column: row[column] for column in base_columns}
            record["crop"] = crop
            for field in CROP_FIELDS_CAMEL:
                record[snake(field)] = row.get(f"{snake(crop)}_{snake(field)}")
            records.append(record)

    columns = (
        base_columns
        + ["crop_group", "crop"]
        + [snake(field) for field in CROP_FIELDS_CAMEL]
    )
    return pd.DataFrame(records, columns=list(dict.fromkeys(columns)))


def keep_wide(frame: pd.DataFrame) -> pd.DataFrame:
    return frame.drop(columns=["_selected_crops", "crop"], errors="ignore")


def clean_values(frame: pd.DataFrame) -> pd.DataFrame:
    for column in frame.columns:
        if frame[column].dtype == object:
            frame[column] = frame[column].apply(
                lambda value: value.strip() if isinstance(value, str) else value
            )

    if "organization" in frame.columns:
        frame["organization_modified"] = (
            frame["organization"].fillna("").astype(str).str.split().str[0].str.upper()
        )
    if {"institution_location_latitude", "institution_location_longitude"}.issubset(frame.columns):
        latitude = frame["institution_location_latitude"].fillna("").astype(str)
        longitude = frame["institution_location_longitude"].fillna("").astype(str)
        frame["location"] = latitude + "," + longitude

    for column, mapping in VALUE_RENAMES.items():
        if column in frame.columns:
            frame[column] = frame[column].replace(mapping)
    return frame


def apply_allowlist(frame: pd.DataFrame) -> pd.DataFrame:
    if COLUMNS_TO_IMPORT:
        columns = [column for column in COLUMNS_TO_IMPORT if column in frame.columns]
        return frame[columns].copy()
    columns_to_drop = [
        column for column in frame.columns
        if column in DROP_COLUMNS and column not in KEEP_META
    ]
    return frame.drop(columns=columns_to_drop, errors="ignore")


def clean(frame: pd.DataFrame) -> pd.DataFrame:
    logger.info("Initial rows: %s, columns: %s", len(frame), len(frame.columns))
    frame.columns = [clean_column(str(column)) for column in frame.columns]

    # Preserve the ONA row number when available. If the export lacks one,
    # capture its original row position before filtering/reshaping/deduping.
    if "index" not in frame.columns and "_index" not in frame.columns:
        frame.insert(0, "index", range(1, len(frame) + 1))
    elif "_index" in frame.columns and "index" not in frame.columns:
        frame = frame.rename(columns={"_index": "index"})

    if frame.columns.duplicated().any():
        duplicate_columns = frame.columns[frame.columns.duplicated()].tolist()
        raise ValueError(f"Form export contains duplicate cleaned headers: {duplicate_columns}")

    for column in frame.columns:
        if (column.startswith("crop_") and column != "crop_group") or column.startswith("cropgroup_"):
            frame[column] = frame[column].map(to_bool)

    crop_group_flags = [
        column for column in frame.columns if column.startswith("cropgroup_")
    ]
    frame["crop_group"] = frame.apply(
        lambda row: selected_crop_groups(row, crop_group_flags), axis=1
    )

    frame["_selected_crops"] = frame.apply(selected_crops, axis=1)
    if CROPS_KEEP:
        wanted_crops = {snake(crop.strip()) for crop in CROPS_KEEP.split(",") if crop.strip()}
        frame["_selected_crops"] = frame["_selected_crops"].apply(
            lambda crops: [crop for crop in crops if snake(crop) in wanted_crops]
        )

    frame = to_long(frame) if FORMAT == "long" else keep_wide(frame)
    frame = clean_values(frame)

    dedupe_key = DEDUPE_KEY if DEDUPE_KEY in frame.columns else "instance_id" if "instance_id" in frame.columns else "uuid" if "uuid" in frame.columns else None
    if dedupe_key:
        dedupe_columns = [dedupe_key]
        if FORMAT == "long" and "crop" in frame.columns:
            dedupe_columns.append("crop")
        frame = frame.drop_duplicates(subset=dedupe_columns, keep="last")

    frame = apply_allowlist(frame)
    logger.info("Final rows after cleaning: %s", len(frame))
    return frame


def format_output(frame: pd.DataFrame) -> pd.DataFrame:
    """Select and order the public B4T columns with user-facing headers."""
    output = pd.DataFrame(index=frame.index)
    for header, candidates in OUTPUT_COLUMNS:
        source = next((column for column in candidates if column in frame.columns), None)
        output[header] = frame[source] if source else ""
        if header == "Organization":
            output[header] = output[header].map(normalize_organization)
        elif header != "Index":
            output[header] = output[header].map(humanize_value)
    return output


def main():
    logger.info("Starting B4T Seed System Mapping pipeline")

    if len(sys.argv) < 8:
        log_step("error", "failed", "Missing pipeline arguments")
        sys.exit(1)

    api_key, base_url, form_id, sheet_name, creds_path, config_path, spreadsheet_key = sys.argv[1:8]
    if form_id != FORM_ID:
        log_step("error", "failed", f"Expected ONA form {FORM_ID}, received {form_id}")
        sys.exit(1)

    temp_path: Path | None = None
    cleaned_path: Path | None = None
    try:
        if FORMAT not in {"long", "wide"}:
            raise ValueError("SEED_FORMAT must be either 'long' or 'wide'")

        logger.info("Downloading form data")
        log_step("download", "running", f"Downloading ONA form {FORM_ID}…")
        response = requests.get(
            f"{base_url.rstrip('/')}/data/{FORM_ID}.xlsx",
            params={
                "labels_only": "false",
                "include_images": "false",
                "do_not_split_multi_selects": "true",
            },
            headers={"Authorization": f"Token {api_key}"},
            timeout=300,
        )
        response.raise_for_status()
        with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as temporary:
            temporary.write(response.content)
            temp_path = Path(temporary.name)
        logger.info("Downloaded %s bytes", len(response.content))
        log_step("download", "complete", f"Downloaded form {FORM_ID}")

        logger.info("Cleaning data and reshaping crop blocks")
        log_step("clean", "running", "Cleaning fields and reshaping crop data…")
        raw = pd.read_excel(
            temp_path,
            sheet_name=SHEET_INDEX,
            dtype=object,
            engine="openpyxl",
        )
        cleaned = format_output(clean(raw))
        logger.info(
            "Prepared %s rows and %s columns from %s submissions",
            len(cleaned),
            len(cleaned.columns),
            len(raw),
        )
        if cleaned.empty:
            raise ValueError("Cleaning produced no rows; the B4T worksheet was not changed")
        if cleaned.columns.duplicated().any():
            raise ValueError("Cleaning produced duplicate column names; the B4T worksheet was not changed")
        if list(cleaned.columns) != [header for header, _ in OUTPUT_COLUMNS]:
            raise ValueError("Formatted B4T output does not match the expected header order")
        cleaned_fd, cleaned_name = tempfile.mkstemp(suffix="_cleaned.xlsx")
        os.close(cleaned_fd)
        cleaned_path = Path(cleaned_name)
        cleaned.to_excel(cleaned_path, index=False, engine="openpyxl")
        log_step(
            "clean",
            "complete",
            f"Cleaned {len(cleaned):,} rows across {len(cleaned.columns):,} columns",
        )

        logger.info("Uploading cleaned data to Google Sheets")
        log_step("upload", "running", "Replacing the B4T worksheet with the full cleaned export…")
        with open(config_path, encoding="utf-8") as config_file:
            spreadsheet_id = json.load(config_file).get(spreadsheet_key)
        if not spreadsheet_id:
            raise ValueError(f"Spreadsheet key '{spreadsheet_key}' is not configured")
        with open(creds_path, encoding="utf-8") as credentials_file:
            service_account = json.load(credentials_file)
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        credentials = Credentials.from_service_account_info(service_account, scopes=scope)
        client = gspread.authorize(credentials)
        spreadsheet = client.open_by_key(spreadsheet_id)

        try:
            worksheet = spreadsheet.worksheet(sheet_name)
        except gspread.WorksheetNotFound:
            worksheet = next(
                (tab for tab in spreadsheet.worksheets() if tab.title in ("Sheet 1", "Sheet1")),
                None,
            )
            if worksheet:
                worksheet.update_title(sheet_name)
            else:
                worksheet = spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=max(26, len(cleaned.columns)))

        upload_data = cleaned.where(pd.notna(cleaned), "").astype(str)
        # ONA exports the full current dataset; replace the worksheet like the other pipelines.
        worksheet.clear()
        gd.set_with_dataframe(worksheet, upload_data, include_index=False, resize=True)
        logger.info(
            "Replaced worksheet '%s' with %s rows and %s columns",
            sheet_name,
            len(upload_data),
            len(upload_data.columns),
        )
        log_step(
            "upload",
            "complete",
            f"Uploaded {len(upload_data):,} rows and {len(upload_data.columns):,} columns",
        )
    except Exception as error:
        logger.error("Seed System Mapping pipeline failed: %s", error)
        logger.exception("Pipeline details")
        log_step("error", "failed", str(error))
        sys.exit(1)
    finally:
        for temporary_path in (temp_path, cleaned_path):
            if temporary_path and temporary_path.exists():
                temporary_path.unlink()

    logger.info("B4T Seed System Mapping pipeline completed successfully")


if __name__ == "__main__":
    main()

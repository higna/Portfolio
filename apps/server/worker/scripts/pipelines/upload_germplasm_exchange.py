"""Merge GHU import/export workbook sheets and refresh the Germplasm sheet."""

from __future__ import annotations

import json
import logging
import re
import sys
from pathlib import Path

import gspread
import gspread_dataframe as gd
import pandas as pd
from google.oauth2.service_account import Credentials


OUTPUT_COLUMNS = [
    "Exchange",
    "Year",
    "Crop",
    "Source",
    "Material Type",
    "End User",
    "Country",
]
STANDARD_CROPS = {
    "Bambara Groundnut",
    "Cassava",
    "Cereals",
    "Cowpea",
    "Forage",
    "Legumes",
    "Legumes and Cereals",
    "Maize",
    "Musa",
    "NPT",
    "Other",
    "RTB",
    "Rice",
    "Soybean",
    "Vegetables",
    "Yam",
}
CROP_ALIASES = {
    "african yam bean": "Legumes",
    "bambara groundnut": "Bambara Groundnut",
    "cereal": "Cereals",
    "legumes and cereal": "Legumes and Cereals",
    "legumes and taro npt": "NPT",
}
STANDARD_MATERIAL_TYPES = {
    "In Vitro",
    "In Vitro and SAH",
    "In Vitro and Tuber",
    "NPT",
    "SAH",
    "Seeds",
    "Stems",
    "Stems and Seeds",
    "Suckers",
    "Tubers",
}
MATERIAL_TYPE_ALIASES = {"seeds and npt": "NPT"}
STANDARD_END_USERS = {
    "CGIAR",
    "IARC",
    "IITA",
    "NA",
    "NARS",
    "Private",
    "Private/IITA",
    "University",
}

HEADER_ALIASES = {
    "Crop": {"crop"},
    "Source": {"source", "sourceofmaterial", "genebankbreederother"},
    "Material Type": {"materialtype", "material"},
    "End User": {"enduser"},
    "Country": {"country"},
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-5s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("upload_germplasm_exchange")


def log_step(step: str, status: str, message: str = "") -> None:
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)


def normalized_header(value: object) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value).strip().lower())


def normalize_value(value: object) -> object:
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return pd.NA
        if value.casefold() == "cgiar":
            return "CGIAR"
    return value


def normalize_source(value: object) -> object:
    if isinstance(value, str):
        labels = {
            "breeder": "Breeder",
            "breeeder": "Breeder",
            "other": "Other",
            "genebank": "Genebank",
        }
        text = value.strip()
        return labels.get(text.casefold(), text.title())
    return value


def normalize_crop(value: object) -> object:
    if not isinstance(value, str) or not value.strip():
        return value
    text = re.sub(r"\s+", " ", value).strip()
    key = text.casefold()
    if key in CROP_ALIASES:
        return CROP_ALIASES[key]
    for crop in STANDARD_CROPS:
        if crop.casefold() == key:
            return crop
    return "Other"


def normalize_material_type(value: object) -> object:
    if not isinstance(value, str) or not value.strip():
        return value
    text = re.sub(r"\s+", " ", value).strip()
    key = text.casefold()
    if key in MATERIAL_TYPE_ALIASES:
        return MATERIAL_TYPE_ALIASES[key]
    for material_type in STANDARD_MATERIAL_TYPES:
        if material_type.casefold() == key:
            return material_type
    raise ValueError(f"Unrecognized material type '{text}'")


def normalize_end_user(value: object) -> object:
    if not isinstance(value, str) or not value.strip():
        return value
    text = re.sub(r"\s+", " ", value).strip()
    key = text.casefold()
    if key in {"cote d'ivoire", "cote d’ivoire"}:
        return "NA"
    for end_user in STANDARD_END_USERS:
        if end_user.casefold() == key:
            return end_user
    return "NA"


def find_header_row(path: Path, sheet_name: str) -> int:
    preview = pd.read_excel(
        path, sheet_name=sheet_name, header=None, nrows=10, keep_default_na=False
    )
    for row_number, row in enumerate(preview.values.tolist()):
        values = {normalized_header(value) for value in row if pd.notna(value)}
        if "slno" in values or "sno" in values:
            return row_number
    raise ValueError(f"Could not find the column header row in sheet '{sheet_name}'")


def find_source_column(columns: list[object], aliases: set[str]) -> object | None:
    return next(
        (column for column in columns if normalized_header(column) in aliases),
        None,
    )


def merge_workbook(path: Path) -> pd.DataFrame:
    workbook = pd.ExcelFile(path, engine="openpyxl")
    frames: list[pd.DataFrame] = []

    for raw_sheet_name in workbook.sheet_names:
        sheet_name = str(raw_sheet_name)
        match = re.search(r"\b(import|export)\b", sheet_name, flags=re.IGNORECASE)
        year_match = re.search(r"\b(20\d{2})\b", sheet_name)
        if not match or not year_match:
            logger.info("Skipping sheet without an import/export year: %s", sheet_name)
            continue

        header_row = find_header_row(path, sheet_name)
        source = pd.read_excel(
            path,
            sheet_name=sheet_name,
            header=header_row,
            dtype=object,
            engine="openpyxl",
            keep_default_na=False,
        )
        source.columns = [str(column).strip() for column in source.columns]

        column_map: dict[str, object] = {}
        for output_column, aliases in HEADER_ALIASES.items():
            source_column = find_source_column(list(source.columns), aliases)
            if source_column is None:
                raise ValueError(
                    f"Sheet '{sheet_name}' is missing a '{output_column}' column"
                )
            column_map[output_column] = source_column

        data_columns = ["Crop", "Source", "Material Type", "End User", "Country"]
        frame = source[[column_map[column] for column in data_columns]].copy()
        frame.columns = data_columns
        frame["Exchange"] = match.group(1).title()
        frame["Year"] = int(year_match.group(1))
        for column in OUTPUT_COLUMNS:
            frame[column] = frame[column].map(normalize_value)
        frame["Source"] = frame["Source"].map(normalize_source)
        frame["Crop"] = frame["Crop"].map(normalize_crop)
        frame["Material Type"] = frame["Material Type"].map(normalize_material_type)
        frame["End User"] = frame["End User"].map(normalize_end_user)

        # Drop footer rows and empty template rows, retaining real exchange rows.
        frame = frame.dropna(how="all", subset=OUTPUT_COLUMNS[2:])
        frames.append(frame)
        logger.info("Read %s exchange records from '%s'", len(frame), sheet_name)

    if not frames:
        raise ValueError("The workbook has no Import/Export sheets with a year")

    merged = pd.concat(frames, ignore_index=True)
    merged = merged[OUTPUT_COLUMNS]
    if merged.empty:
        raise ValueError("No exchange records were found; the Google Sheet was not changed")
    return merged


def main() -> None:
    if len(sys.argv) != 6:
        log_step("error", "failed", "Expected workbook, credentials, config, spreadsheet key, and sheet name")
        sys.exit(1)

    workbook_path = Path(sys.argv[1])
    creds_path = Path(sys.argv[2])
    config_path = Path(sys.argv[3])
    spreadsheet_key = sys.argv[4]
    sheet_name = sys.argv[5]

    try:
        log_step("clean", "running", "Merging Import and Export sheets")
        merged = merge_workbook(workbook_path)
        logger.info("Prepared %s rows across %s columns", len(merged), len(merged.columns))
        log_step("clean", "complete", f"Merged {len(merged):,} exchange records")

        with config_path.open(encoding="utf-8") as config_file:
            spreadsheet_id = json.load(config_file).get(spreadsheet_key)
        if not spreadsheet_id:
            raise ValueError(f"Spreadsheet key '{spreadsheet_key}' is not configured")
        with creds_path.open(encoding="utf-8") as credentials_file:
            service_account = json.load(credentials_file)

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]
        credentials = Credentials.from_service_account_info(
            service_account, scopes=scopes
        )
        client = gspread.authorize(credentials)
        spreadsheet = client.open_by_key(spreadsheet_id)
        worksheet = spreadsheet.worksheet(sheet_name)

        log_step("upload", "running", f"Replacing the '{sheet_name}' worksheet")
        upload_data = merged.where(pd.notna(merged), "")
        worksheet.clear()
        gd.set_with_dataframe(worksheet, upload_data, include_index=False, resize=True)
        log_step(
            "upload",
            "complete",
            f"Uploaded {len(upload_data):,} rows and {len(upload_data.columns):,} columns",
        )
    except Exception as error:
        logger.exception("Germplasm exchange upload failed")
        log_step("error", "failed", str(error))
        sys.exit(1)


if __name__ == "__main__":
    main()

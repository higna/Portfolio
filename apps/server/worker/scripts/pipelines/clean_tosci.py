"""
TOSCI Pipeline.
Downloads form 818636 from ONA, cleans the data, and uploads to Google Sheets.
Usage: python clean_tosci.py <api_key> <base_url> <form_id> <sheet_name> <creds_path> <spreadsheet_config_path> <spreadsheet_key>
"""

import sys, json, os, tempfile, logging, traceback
import pandas as pd
import requests
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import gspread_dataframe as gd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-5s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("clean_tosci")


def log_step(step: str, status: str, message: str = ""):
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)


def main():
    logger.info("Starting TOSCI Pipeline")

    if len(sys.argv) < 8:
        log_step("error", "failed", "Missing arguments")
        sys.exit(1)

    api_key = sys.argv[1]
    base_url = sys.argv[2]
    form_id = sys.argv[3]
    sheet_name = sys.argv[4]
    creds_path = sys.argv[5]
    spreadsheet_config_path = sys.argv[6]
    spreadsheet_key = sys.argv[7]

    # Fixed export options
    options = (
        "labels_only=true" "&include_images=false" "&do_not_split_multi_selects=true"
    )
    url = f"{base_url}/data/{form_id}.xlsx?{options}"

    # ──── Step 1: Download ────────────────────────────────
    logger.info("Downloading form data…")
    log_step("download", "running", "Downloading form data…")
    try:
        resp = requests.get(
            url, headers={"Authorization": f"Token {api_key}"}, timeout=60
        )
        resp.raise_for_status()
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        tmp.write(resp.content)
        tmp.close()
        logger.info(f"Downloaded {len(resp.content)} bytes")
        log_step("download", "complete", f"Downloaded form {form_id}")
    except Exception as e:
        logger.error(f"Download failed: {e}")
        log_step("download", "failed", str(e))
        sys.exit(1)

    # ──── Step 2: Clean (using full ONA paths) ─────
    logger.info("Cleaning data…")
    log_step("clean", "running", "Cleaning data…")
    try:
        df = pd.read_excel(tmp.name, engine="openpyxl")
        logger.info(f"Initial rows: {len(df)}")

        # Column selection – full paths because labels_only still includes group prefix
        columns_to_import = [
            "reg_number",
            "group_enum/bestregions",
            "group_enum/_Location_of_field_within_the_farm_latitude",
            "group_enum/_Location_of_field_within_the_farm_longitude",
            "group_zo4vi28/Select_crop",
            "group_zo4vi28/Select_Variety",
            "group_zo4vi28/Class_of_Seed",
            "group_zo4vi28/prodyear",
            "group_zo4vi28/Hectarage",
        ]

        # Keep only columns that actually exist
        existing_cols = [c for c in columns_to_import if c in df.columns]
        data = df[existing_cols].copy()

        # Rename columns
        column_renames = {
            "reg_number": "Field ID",
            "group_enum/bestregions": "Regions",
            "group_enum/_Location_of_field_within_the_farm_latitude": "Latitude",
            "group_enum/_Location_of_field_within_the_farm_longitude": "Longitude",
            "group_zo4vi28/Select_crop": "Crop",
            "group_zo4vi28/Select_Variety": "Variety",
            "group_zo4vi28/Class_of_Seed": "Seed Class",
            "group_zo4vi28/prodyear": "Year",
            "group_zo4vi28/Hectarage": "Ha",
        }
        data = data.rename(columns=column_renames)

        # Create Location column
        data["Location"] = (
            data["Latitude"].astype(str) + "," + data["Longitude"].astype(str)
        )

        # Strip whitespace
        columns_to_trim = ["Regions", "Variety", "Seed Class"]
        for column in columns_to_trim:
            if column in data.columns:
                data[column] = data[column].str.strip()

        # Capitalize Regions, Crop, Variety
        columns_to_capitalize = ["Regions", "Crop", "Variety"]
        for column in columns_to_capitalize:
            if column in data.columns:
                data[column] = data[column].str.title()

        # Replace underscores with spaces
        def transform(value):
            if pd.isna(value):
                return value
            return value.replace("_", " ")

        columns_to_transform = ["Seed Class", "Crop", "Regions", "Variety"]
        for column in columns_to_transform:
            if column in data.columns:
                data[column] = data[column].apply(transform)

        # Rename seed classes
        seed_class_renames = {
            "pre basic": "Breeder / Pre-Basic",
            "certified": "Certified",
            "basic": "Foundation / Basic",
            "qds": "QDS",
        }
        if "Seed Class" in data.columns:
            data["Seed Class"] = data["Seed Class"].replace(seed_class_renames)

        # Reorder columns
        order = [
            "Field ID",
            "Regions",
            "Latitude",
            "Longitude",
            "Location",
            "Crop",
            "Variety",
            "Seed Class",
            "Year",
            "Ha",
        ]
        data = data[[c for c in order if c in data.columns]]

        logger.info(f"Final rows after cleaning: {len(data)}")

        cleaned_path = os.path.join(tempfile.gettempdir(), f"{form_id}_cleaned.xlsx")
        data.to_excel(cleaned_path, index=False, engine="openpyxl")

        log_step("clean", "complete", f"Cleaned {len(data)} rows")
    except Exception as e:
        logger.error(f"Cleaning failed: {e}")
        traceback.print_exc()
        log_step("clean", "failed", str(e))
        sys.exit(1)

    # ──── Step 3: Upload ─────────────────────────────────
    logger.info("Uploading to Google Sheets…")
    log_step("upload", "running", "Uploading to Google Sheets…")
    try:
        with open(spreadsheet_config_path, "r") as f:
            config = json.load(f)
        spreadsheet_id = config.get(spreadsheet_key)
        if not spreadsheet_id:
            raise ValueError(f"Spreadsheet key '{spreadsheet_key}' not found")

        with open(creds_path, "r") as f:
            creds_json = json.load(f)
        scope = [
            "https://spreadsheets.google.com/feeds",
            "https://www.googleapis.com/auth/drive",
        ]
        credentials = ServiceAccountCredentials.from_json_keyfile_dict(
            creds_json, scope
        )
        client = gspread.authorize(credentials)

        sheet = client.open_by_key(spreadsheet_id).worksheet(sheet_name)
        sheet.clear()

        # Convert all columns to strings to avoid dtype conflicts
        data = data.astype(str)
        data.fillna("", inplace=True)

        gd.set_with_dataframe(sheet, data)
        logger.info(f"Uploaded {len(data)} rows to sheet '{sheet_name}'")
        log_step("upload", "complete", f"Uploaded {len(data)} rows")
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        log_step("upload", "failed", str(e))
        sys.exit(1)
    finally:
        if os.path.exists(tmp.name):
            os.unlink(tmp.name)
        if "cleaned_path" in locals() and os.path.exists(cleaned_path):
            os.unlink(cleaned_path)

    logger.info("TOSCI Pipeline completed successfully")


if __name__ == "__main__":
    main()

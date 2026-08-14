"""
Cocoa Farm Registration pipeline.
Streams step updates as JSON lines to stdout.
Usage: python clean_cocoa_farm.py <api_key> <base_url> <form_id> <sheet_name> <creds_path> <spreadsheet_config_path> <spreadsheet_key>
"""

import sys, json, os, tempfile, logging, traceback
import pandas as pd
import numpy as np
import requests
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import gspread_dataframe as gd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-5s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("clean_cocoa_farm")


def log_step(step: str, status: str, message: str = ""):
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)


def main():
    logger.info("Starting Cocoa Farm Pipeline")

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

    # ──── Step 2: Clean (refined logic) ───────────────────
    logger.info("Cleaning data…")
    log_step("clean", "running", "Cleaning data…")
    try:
        df = pd.read_excel(tmp.name, engine="openpyxl")
        logger.info(f"Initial rows: {len(df)}")

        # 1. Column mapping (full ONA paths)
        column_mapping = {
            "today": "TODAY",
            "heading/field_id": "FARMER ID",
            "heading/farm_information/planting_material/area_calculation": "FARM AREA",
            "heading/farm_information/year": "PRODUCTION YEAR",
            "heading/farm_information/planting_material/planting_purpose": "PLANTING PURPOSE",
            "heading/farm_information/planting_material/seedlingRecieved": "SEEDLING RECEIVED",
            "heading/farm_information/planting_material/variety": "VARIETIES",
            "heading/farm_information/planting_material/crops": "CROPS",
            "heading/farm_information/geo_information/zone": "ZONE",
            "heading/farm_information/geo_information/state": "STATE",
            "heading/farm_information/geo_information/lga": "LGA",
            "heading/farm_information/geo_information/city": "CITY",
            "heading/farm_information/geo_information/_gps_latitude": "LATITUDE",
            "heading/farm_information/geo_information/_gps_longitude": "LONGITUDE",
            "heading/farm_information/geo_information/gps": "GPS",
            "heading/survey_information/surv_name": "ENUMERATOR NAME",
        }

        existing_cols = [col for col in column_mapping.keys() if col in df.columns]
        df = df[existing_cols].copy()
        df.rename(columns=column_mapping, inplace=True)

        # 2. Text cleaning helpers
        def clean_title(value):
            if isinstance(value, str):
                value = value.replace("_", " ").replace(".", " ")
                return " ".join(value.split()).title()
            return value

        def clean_upper(value):
            if isinstance(value, str):
                return " ".join(value.split()).upper()
            return value

        # 3. Clean geographical and enumerator columns
        for col in ["ZONE", "STATE", "LGA", "CITY", "ENUMERATOR NAME"]:
            if col in df.columns:
                df[col] = df[col].apply(clean_title)

        # 4. GPS LOCATION
        if "GPS" in df.columns:
            df["GPS LOCATION"] = df["GPS"].apply(
                lambda x: ", ".join(x.split()[:2]) if isinstance(x, str) else x
            )
            logger.info("GPS LOCATION created from combined 'GPS' column.")
        elif "LATITUDE" in df.columns and "LONGITUDE" in df.columns:
            df["GPS LOCATION"] = (
                df["LATITUDE"].astype(str) + ", " + df["LONGITUDE"].astype(str)
            )
            logger.info("GPS LOCATION created from LATITUDE and LONGITUDE.")
        else:
            logger.warning("No GPS data available; GPS LOCATION will be empty.")
            df["GPS LOCATION"] = None

        # 5. VARIETIES to uppercase
        if "VARIETIES" in df.columns:
            df["VARIETIES"] = df["VARIETIES"].apply(clean_upper)

        # ─── ADD INDEX BEFORE EXPLODING ───
        df.insert(0, "INDEX", range(1, len(df) + 1))
        df["INDEX"] = df["INDEX"].astype(str)

        # 6. Explode multi-value columns
        for col in ["PLANTING PURPOSE", "SEEDLING RECEIVED", "VARIETIES", "CROPS"]:
            if col in df.columns:
                df[col] = df[col].fillna("").astype(str)
                df = df.assign(**{col: df[col].str.split(r"\s+")}).explode(col)
                df = df[df[col].str.strip() != ""]
                logger.info(f"Exploded column '{col}'.")

        # 7. Map purpose & seedling
        purpose_map = {"new": "New Planting", "rehab": "Rehabilitation"}
        seedling_map = {"hybrid": "Hybrid Seedlings", "grafted": "Grafted Seedlings"}

        if "PLANTING PURPOSE" in df.columns:
            df["PLANTING PURPOSE"] = (
                df["PLANTING PURPOSE"].map(purpose_map).fillna(df["PLANTING PURPOSE"])
            )
        if "SEEDLING RECEIVED" in df.columns:
            df["SEEDLING RECEIVED"] = (
                df["SEEDLING RECEIVED"]
                .map(seedling_map)
                .fillna(df["SEEDLING RECEIVED"])
            )

        # 8. Clean CROPS to Title Case
        if "CROPS" in df.columns:
            df["CROPS"] = df["CROPS"].apply(clean_title)

        # 9. Final column order (INDEX first)
        final_order = [
            "INDEX",
            "TODAY",
            "FARMER ID",
            "FARM AREA",
            "PRODUCTION YEAR",
            "PLANTING PURPOSE",
            "SEEDLING RECEIVED",
            "VARIETIES",
            "CROPS",
            "ZONE",
            "STATE",
            "LGA",
            "CITY",
            "GPS LOCATION",
            "ENUMERATOR NAME",
        ]
        df = df[[col for col in final_order if col in df.columns]]

        logger.info(f"Final rows after cleaning: {len(df)}")

        cleaned_path = os.path.join(tempfile.gettempdir(), f"{form_id}_cleaned.xlsx")
        df.to_excel(cleaned_path, index=False, engine="openpyxl")

        log_step("clean", "complete", f"Cleaned {len(df)} rows")
    except Exception as e:
        logger.error(f"Cleaning failed: {e}")
        traceback.print_exc()
        log_step("clean", "failed", str(e))
        sys.exit(1)

    # ──── Step 3: Upload ─────────────────────────────────
    logger.info("Uploading to Google Sheets…")
    log_step("upload", "running", "Uploading to Google Sheets…")
    try:
        if len(df) == 0:
            logger.warning("No data to upload")
            log_step("upload", "failed", "No data to upload")
            sys.exit(1)

        with open(spreadsheet_config_path, "r") as f:
            config = json.load(f)
        spreadsheet_id = config.get(spreadsheet_key)
        if not spreadsheet_id:
            raise ValueError(f"Spreadsheet key '{spreadsheet_key}' not found in config")

        with open(creds_path, "r") as f:
            creds_json = json.load(f)

        # Replace inf/-inf/NaN with None so Google Sheets accepts the data
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.where(pd.notnull(df), None)

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
        gd.set_with_dataframe(sheet, df)
        logger.info(f"Uploaded {len(df)} rows to sheet '{sheet_name}'")
        log_step("upload", "complete", f"Uploaded {len(df)} rows")
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        log_step("upload", "failed", str(e))
        sys.exit(1)
    finally:
        if os.path.exists(tmp.name):
            os.unlink(tmp.name)
        if "cleaned_path" in locals() and os.path.exists(cleaned_path):
            os.unlink(cleaned_path)

    logger.info("Cocoa Farm Pipeline completed successfully")


if __name__ == "__main__":
    main()

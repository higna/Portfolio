"""
Cocoa Farmer Registration pipeline.
Streams step updates as JSON lines to stdout.
Usage: python clean_cocoa_farmer.py <api_key> <base_url> <form_id> <sheet_name> <creds_path> <spreadsheet_config_path> <spreadsheet_key>
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
logger = logging.getLogger("clean_cocoa_farmer")


def log_step(step: str, status: str, message: str = ""):
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)


def main():
    logger.info("Starting Cocoa Farmer Pipeline")

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

    # ──── Step 2: Clean (with FARMER ID) ──────────────────
    logger.info("Cleaning data…")
    log_step("clean", "running", "Cleaning data…")
    try:
        df = pd.read_excel(tmp.name, engine="openpyxl")
        logger.info(f"Initial rows: {len(df)}")

        column_mapping = {
            "today": "TODAY",
            "heading/field_no": "FARMER ID",
            "heading/bio_information/f_name": "FIRST NAME",
            "heading/bio_information/m_name": "MIDDLE NAME",
            "heading/bio_information/l_name": "LAST NAME",
            "heading/bio_information/age": "AGE",
            "heading/bio_information/gender": "GENDER",
            "heading/bio_information/education_status": "EDUCATION STATUS",
            "heading/contact_information/phone": "PHONE NUMBER",
            "heading/contact_information/email": "EMAIL",
            "heading/contact_information/address/zone": "ZONE",
            "heading/contact_information/address/state": "STATE",
            "heading/contact_information/address/lga": "LGA",
            "heading/contact_information/address/city": "CITY",
            "heading/farmer_information/_geo_location_latitude": "LATITUDE",
            "heading/farmer_information/_geo_location_longitude": "LONGITUDE",
            "heading/farmer_information/income_assets/planting_material_cocoa": "COCOA PLANTING MATERIAL",
            "heading/farmer_information/income_assets/planting_material_shade": "SHADE TREE PLANTING MATERIAL",
            "heading/farmer_information/income_assets/farm_size": "FARM SIZE",
            "heading/farmer_information/income_assets/seed_production": "SEED PRODUCTION",
            "heading/access_group/access_input_providers": "ACCESS TO INPUT PROVIDERS",
            "heading/access_group/access_business_service_providers": "ACCESS TO BUSINESS SERVICE PROVIDERS",
            "heading/access_group/access_off_takers": "ACCESS TO OFF TAKERS",
            "heading/access_group/access_financial_providers_providers": "ACCESS TO FINANCIAL SERVICE PROVIDERS",
            "heading/access_group/access_mechanization_providers_providers": "ACCESS TO MECHANIZATION SERVICE PROVIDERS",
            "heading/access_group/access_advisory_services": "ACCESS TO ADVISORY SERVICES",
            "heading/cooperative_membership/cooperative_association": "COOPERATIVE ASSOCIATION",
            "heading/survey_information/enumerator_name": "ENUMERATOR NAME",
        }

        existing_columns = [col for col in column_mapping.keys() if col in df.columns]
        df_selected = df[existing_columns].copy()
        df_selected.rename(columns=column_mapping, inplace=True)

        # AGE numeric conversion before binning
        df_selected["AGE"] = (
            pd.to_numeric(df_selected["AGE"].astype(str).str.strip(), errors="coerce")
            .fillna(0)
            .astype(int)
        )

        bins = [0, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200]
        labels = [
            "1-20",
            "21-30",
            "31-40",
            "41-50",
            "51-60",
            "61-70",
            "71-80",
            "81-90",
            "91-100",
            "100+",
        ]
        df_selected["AGE GROUP"] = pd.cut(
            df_selected["AGE"], bins=bins, labels=labels, right=False
        )
        logger.info("Created AGE GROUP")

        df_selected["GPS LOCATION"] = (
            df_selected["LATITUDE"].astype(str)
            + ", "
            + df_selected["LONGITUDE"].astype(str)
        )
        logger.info("Created GPS LOCATION")

        columns_to_clean = [
            "ZONE",
            "STATE",
            "LGA",
            "CITY",
            "GENDER",
            "EDUCATION STATUS",
            "ACCESS TO INPUT PROVIDERS",
            "ACCESS TO BUSINESS SERVICE PROVIDERS",
            "ACCESS TO OFF TAKERS",
            "ACCESS TO FINANCIAL SERVICE PROVIDERS",
            "ACCESS TO MECHANIZATION SERVICE PROVIDERS",
            "ACCESS TO ADVISORY SERVICES",
            "COCOA PLANTING MATERIAL",
            "SHADE TREE PLANTING MATERIAL",
            "SEED PRODUCTION",
            "COOPERATIVE ASSOCIATION",
            "ENUMERATOR NAME",
        ]

        def clean_text(value):
            if isinstance(value, str):
                value = value.replace("_", " ").replace(".", " ")
                return " ".join(value.split()).title()
            return value

        for col in columns_to_clean:
            if col in df_selected.columns:
                df_selected[col] = df_selected[col].apply(clean_text)
        logger.info("Cleaned text columns")

        final_columns = [
            "TODAY",
            "FARMER ID",
            "FIRST NAME",
            "MIDDLE NAME",
            "LAST NAME",
            "AGE",
            "AGE GROUP",
            "GENDER",
            "EDUCATION STATUS",
            "PHONE NUMBER",
            "EMAIL",
            "ZONE",
            "STATE",
            "LGA",
            "CITY",
            "LATITUDE",
            "LONGITUDE",
            "GPS LOCATION",
            "COCOA PLANTING MATERIAL",
            "SHADE TREE PLANTING MATERIAL",
            "FARM SIZE",
            "SEED PRODUCTION",
            "ACCESS TO INPUT PROVIDERS",
            "ACCESS TO BUSINESS SERVICE PROVIDERS",
            "ACCESS TO OFF TAKERS",
            "ACCESS TO FINANCIAL SERVICE PROVIDERS",
            "ACCESS TO MECHANIZATION SERVICE PROVIDERS",
            "ACCESS TO ADVISORY SERVICES",
            "COOPERATIVE ASSOCIATION",
            "ENUMERATOR NAME",
        ]
        df_final = df_selected[final_columns]

        logger.info(f"Final rows: {len(df_final)}")

        cleaned_path = os.path.join(tempfile.gettempdir(), f"{form_id}_cleaned.xlsx")
        df_final.to_excel(cleaned_path, index=False, engine="openpyxl")

        log_step("clean", "complete", f"Cleaned {len(df_final)} rows")
    except Exception as e:
        logger.error(f"Cleaning failed: {e}")
        traceback.print_exc()
        log_step("clean", "failed", str(e))
        sys.exit(1)

    # ──── Step 3: Upload ─────────────────────────────────
    logger.info("Uploading to Google Sheets…")
    log_step("upload", "running", "Uploading to Google Sheets…")
    try:
        if len(df_final) == 0:
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
        gd.set_with_dataframe(sheet, df_final)
        logger.info(f"Uploaded {len(df_final)} rows to sheet '{sheet_name}'")
        log_step("upload", "complete", f"Uploaded {len(df_final)} rows")
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        log_step("upload", "failed", str(e))
        sys.exit(1)
    finally:
        if os.path.exists(tmp.name):
            os.unlink(tmp.name)
        if "cleaned_path" in locals() and os.path.exists(cleaned_path):
            os.unlink(cleaned_path)

    logger.info("Cocoa Farmer Pipeline completed successfully")


if __name__ == "__main__":
    main()

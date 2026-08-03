"""
Cassava SPP Pipeline.
Downloads form 179430 from ONA, cleans the data, and uploads to Google Sheets.
Uses the exact cleaning logic from the original stand‑alone script.
Usage: python clean_cassava.py <api_key> <base_url> <form_id> <sheet_name> <creds_path> <spreadsheet_config_path> <spreadsheet_key>
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
logger = logging.getLogger("clean_cassava")


def log_step(step: str, status: str, message: str = ""):
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)


def main():
    logger.info("Starting Cassava Pipeline")

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
        "labels_only=true"
        "&include_images=false"
        "&do_not_split_multi_selects=true"
    )
    url = f"{base_url}/data/{form_id}.xlsx?{options}"

    # ──── Step 1: Download ────────────────────────────────
    logger.info("Downloading form data…")
    log_step("download", "running", "Downloading form data…")
    try:
        resp = requests.get(url, headers={"Authorization": f"Token {api_key}"}, timeout=60)
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

    # ──── Step 2: Clean (exact logic from original script) ─────
    logger.info("Cleaning data…")
    log_step("clean", "running", "Cleaning data…")
    try:
        # Read the first sheet (all labels_only data goes to a single sheet)
        df = pd.read_excel(tmp.name, engine='openpyxl')
        logger.info(f"Initial rows: {len(df)}")

        # Column selection – use the FULL PATH names from the original script
        columns_to_import = [
            "field_no",
            "organization",
            "city_field",
            "state",
            "_sec1_coordinates_latitude",
            "_sec1_coordinates_longitude",
            "Year_of_production",
            "var_name",
            "grp_field/sec2_area",          # full path
            "grp_field/sec2_area_unit",     # full path
            "sec1_seedpurpose"
        ]

        # Keep only existing columns (some may be missing)
        existing_cols = [c for c in columns_to_import if c in df.columns]
        data = df[existing_cols].copy()

        # Create Location column
        data["Location"] = (
            data["_sec1_coordinates_latitude"].astype(str)
            + ","
            + data["_sec1_coordinates_longitude"].astype(str)
        )

        # Rename columns exactly as in original
        column_renames = {
            "field_no": "Field Id",
            "organization": "Organization",
            "city_field": "City",
            "state": "State",
            "_sec1_coordinates_latitude": "Latitude",
            "_sec1_coordinates_longitude": "Longitude",
            "Year_of_production": "Prod Year",
            "var_name": "Variety",
            "sec1_seedpurpose": "Seed Class",
            "grp_field/sec2_area": "Area",
            "grp_field/sec2_area_unit": "Area Unit",
        }
        data = data.rename(columns=column_renames)

        # Strip whitespace
        columns_to_trim = ["Organization", "City", "State", "Variety", "Seed Class"]
        for column in columns_to_trim:
            if column in data.columns:
                data[column] = data[column].str.strip()

        # Capitalize State and City
        for column in ["State", "City"]:
            if column in data.columns:
                data[column] = data[column].str.title()

        # Organization Modified (first word uppercase)
        data["Organization Modified"] = (
            data["Organization"].str.split().str[0].str.upper().str.strip()
        )

        # Rename seed classes
        seed_class_renames = {
            "Commercial_seed": "Certified Seed",
            "breeder": "Breeder Seed",
            "Foundation": "Foundation Seed",
        }
        data["Seed Class"] = data["Seed Class"].replace(seed_class_renames)

        # Modify variety names
        def modify_variety(variety):
            others = [
                "NR8082",
                "NR87184",
                "TMS 01/1371",
                "TMS-IBA010040",
                "TMS-IBA011368",
                "TMS-IBA011412",
                "TMS-IBA070539",
                "TMS-IBA30572",
                "TMS-IBA9702205",
                "TMS-IBA980510",
                "TMS-IBA980581",
            ]
            if variety in others:
                return "Others"
            elif variety == "Farmers_Pride":
                return "Farmer's Pride"
            elif variety == "Obasanjo_2":
                return "Obasanjo 2"
            elif variety == "Baba70":
                return "Baba 70"
            else:
                return variety

        if "Variety" in data.columns:
            data["Variety Modified"] = data["Variety"].apply(modify_variety)

        logger.info(f"Final rows after cleaning: {len(data)}")

        # Save cleaned data to temp file (optional)
        cleaned_path = os.path.join(tempfile.gettempdir(), f"{form_id}_cleaned.xlsx")
        data.to_excel(cleaned_path, index=False, engine='openpyxl')

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
        with open(spreadsheet_config_path, 'r') as f:
            config = json.load(f)
        spreadsheet_id = config.get(spreadsheet_key)
        if not spreadsheet_id:
            raise ValueError(f"Spreadsheet key '{spreadsheet_key}' not found")

        with open(creds_path, 'r') as f:
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
        if 'cleaned_path' in locals() and os.path.exists(cleaned_path):
            os.unlink(cleaned_path)

    logger.info("Cassava Pipeline completed successfully")


if __name__ == "__main__":
    main()
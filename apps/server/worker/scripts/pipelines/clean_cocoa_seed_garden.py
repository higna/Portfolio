"""
Cocoa Seed Garden Registration pipeline.
Usage: python clean_cocoa_seed_garden.py <api_key> <base_url> <form_id> <sheet_name> <creds_path> <spreadsheet_config_path> <spreadsheet_key>
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
logger = logging.getLogger("clean_cocoa_seed_garden")

def log_step(step: str, status: str, message: str = ""):
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)

def clean_text(val):
    if isinstance(val, str):
        val = val.replace('_', ' ').replace('.', ' ')
        return ' '.join(val.split()).title()
    return val

def main():
    logger.info("Starting Cocoa Seed Garden Pipeline")
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

    options = "labels_only=true&include_images=false&do_not_split_multi_selects=true"
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

    # ──── Step 2: Clean ───────────────────────────────────
    logger.info("Cleaning data…")
    log_step("clean", "running", "Cleaning data…")
    try:
        df = pd.read_excel(tmp.name, sheet_name=0, engine='openpyxl')
        logger.info(f"Initial rows: {len(df)}")

        columns_to_select = [
            "today", "heading/field_no", "heading/farmer_info/organization",
            "heading/farmer_info/garden_tpe", "heading/farmer_info/zone",
            "heading/farmer_info/state", "heading/farmer_info/lga",
            "heading/farmer_info/city", "heading/farmer_info/location",
            "heading/farmer_info/_gps_latitude", "heading/farmer_info/_gps_longitude",
            "heading/farmer_info/productionYear",
            "heading/garden_registration/frin_garden_registration/frin_garden_purpose",
            "heading/garden_registration/frin_garden_registration/frin_year",
            "heading/garden_registration/frin_garden_registration/frin_area",
            "heading/garden_registration/frin_garden_registration/frin_tree",
            "heading/garden_registration/frin_garden_registration/frin_shade",
            "heading/garden_registration/frin_garden_registration/variety_produced",
            "heading/garden_registration/frin_garden_registration/crops_timber",
            "heading/garden_registration/frin_garden_registration/crops_fruit",
            "heading/garden_registration/frin_garden_registration/other_crops_shade",
            "heading/garden_registration/crin_garden_registration/garden_purpose",
            "heading/garden_registration/crin_garden_registration/crin_year",
            "heading/garden_registration/crin_garden_registration/area",
            "heading/garden_registration/crin_garden_registration/tree",
            "heading/garden_registration/crin_garden_registration/polyclonal",
            "heading/garden_registration/crin_garden_registration/clones",
            "heading/garden_registration/crin_garden_registration/other_variety",
            "heading/garden_registration/crin_garden_registration/crops_shade",
            "heading/garden_registration/crin_garden_registration/crops_timber",
            "heading/garden_registration/crin_garden_registration/crops_fruit",
            "heading/garden_registration/crin_garden_registration/other_crops_shade",
            "heading/survey_information/surv_date"
        ]
        existing_cols = [col for col in columns_to_select if col in df.columns]
        df_clean = df[existing_cols].copy()

        rename_map = {
            "today": "TODAY", "heading/field_no": "GARDEN ID",
            "heading/farmer_info/organization": "ORGANIZATION",
            "heading/farmer_info/garden_tpe": "GARDEN TYPE",
            "heading/farmer_info/zone": "ZONE", "heading/farmer_info/state": "STATE",
            "heading/farmer_info/lga": "LGA", "heading/farmer_info/city": "CITY",
            "heading/farmer_info/location": "LOCATION DESCRIPTION",
            "heading/farmer_info/_gps_latitude": "LATITUDE",
            "heading/farmer_info/_gps_longitude": "LONGITUDE",
            "heading/farmer_info/productionYear": "PRODUCTION YEAR",
            "heading/garden_registration/frin_garden_registration/frin_garden_purpose": "FRIN_PURPOSE",
            "heading/garden_registration/frin_garden_registration/frin_year": "FRIN_YEAR",
            "heading/garden_registration/frin_garden_registration/frin_area": "FRIN_AREA",
            "heading/garden_registration/frin_garden_registration/frin_tree": "FRIN_TREES",
            "heading/garden_registration/frin_garden_registration/frin_shade": "FRIN_SHADE",
            "heading/garden_registration/frin_garden_registration/variety_produced": "FRIN_VARIETIES",
            "heading/garden_registration/frin_garden_registration/crops_timber": "FRIN_TIMBER",
            "heading/garden_registration/frin_garden_registration/crops_fruit": "FRIN_FRUIT",
            "heading/garden_registration/frin_garden_registration/other_crops_shade": "FRIN_OTHER_CROPS",
            "heading/garden_registration/crin_garden_registration/garden_purpose": "CRIN_PURPOSE",
            "heading/garden_registration/crin_garden_registration/crin_year": "CRIN_YEAR",
            "heading/garden_registration/crin_garden_registration/area": "CRIN_AREA",
            "heading/garden_registration/crin_garden_registration/tree": "CRIN_TREES",
            "heading/garden_registration/crin_garden_registration/polyclonal": "CRIN_POLYCLONAL",
            "heading/garden_registration/crin_garden_registration/clones": "CRIN_CLONES",
            "heading/garden_registration/crin_garden_registration/other_variety": "CRIN_OTHER_VARIETIES",
            "heading/garden_registration/crin_garden_registration/crops_shade": "CRIN_SHADE",
            "heading/garden_registration/crin_garden_registration/crops_timber": "CRIN_TIMBER",
            "heading/garden_registration/crin_garden_registration/crops_fruit": "CRIN_FRUIT",
            "heading/garden_registration/crin_garden_registration/other_crops_shade": "CRIN_OTHER_CROPS",
            "heading/survey_information/surv_date": "SURVEY DATE"
        }
        df_clean.rename(columns=rename_map, inplace=True)

        df_clean['PURPOSE'] = df_clean['FRIN_PURPOSE'].combine_first(df_clean['CRIN_PURPOSE'])
        df_clean['YEAR'] = df_clean['FRIN_YEAR'].combine_first(df_clean['CRIN_YEAR'])
        df_clean['AREA (Ha)'] = pd.to_numeric(df_clean['FRIN_AREA'], errors='coerce').combine_first(
                                 pd.to_numeric(df_clean['CRIN_AREA'], errors='coerce'))
        df_clean['TREE COUNT'] = pd.to_numeric(df_clean['FRIN_TREES'], errors='coerce').combine_first(
                                 pd.to_numeric(df_clean['CRIN_TREES'], errors='coerce'))
        df_clean['SHADE TREES'] = df_clean['FRIN_SHADE'].combine_first(df_clean['CRIN_SHADE'])
        df_clean['CLONES / VARIETIES'] = df_clean['FRIN_VARIETIES'].combine_first(df_clean['CRIN_CLONES'])
        df_clean['CLONES / VARIETIES'] = df_clean['CLONES / VARIETIES'].combine_first(df_clean['CRIN_OTHER_VARIETIES'])
        df_clean['POLYCLONAL'] = df_clean['CRIN_POLYCLONAL']
        df_clean['INTERCROPS (Timber)'] = df_clean['FRIN_TIMBER'].combine_first(df_clean['CRIN_TIMBER'])
        df_clean['INTERCROPS (Fruit)'] = df_clean['FRIN_FRUIT'].combine_first(df_clean['CRIN_FRUIT'])
        df_clean['INTERCROPS (Other)'] = df_clean['FRIN_OTHER_CROPS'].combine_first(df_clean['CRIN_OTHER_CROPS'])

        df_clean['GPS LOCATION'] = df_clean['LATITUDE'].astype(str) + ', ' + df_clean['LONGITUDE'].astype(str)
        df_clean['TREE DENSITY (per Ha)'] = df_clean['TREE COUNT'] / df_clean['AREA (Ha)']
        df_clean['TREE DENSITY (per Ha)'] = df_clean['TREE DENSITY (per Ha)'].replace([np.inf, -np.inf], np.nan)

        # ── Text cleaning ──
        text_cols = [
            'GARDEN TYPE', 'ZONE', 'STATE', 'LGA', 'CITY',
            'LOCATION DESCRIPTION', 'PURPOSE', 'SHADE TREES',
            'POLYCLONAL', 'INTERCROPS (Timber)', 'INTERCROPS (Fruit)', 'INTERCROPS (Other)'
        ]
        for col in text_cols:
            if col in df_clean.columns:
                df_clean[col] = df_clean[col].apply(clean_text)

        # Organization → uppercase
        if 'ORGANIZATION' in df_clean.columns:
            df_clean['ORGANIZATION'] = df_clean['ORGANIZATION'].astype(str).str.strip().str.upper()

        # Varieties → uppercase
        if 'CLONES / VARIETIES' in df_clean.columns:
            df_clean['CLONES / VARIETIES'] = df_clean['CLONES / VARIETIES'].astype(str).str.strip().str.upper()

        # ── Add INDEX before exploding ──
        df_clean.insert(0, 'INDEX', range(1, len(df_clean) + 1))

        # ── Explode varieties ──
        if 'CLONES / VARIETIES' in df_clean.columns:
            df_clean['CLONES / VARIETIES'] = df_clean['CLONES / VARIETIES'].fillna('')
            df_clean = df_clean.assign(
                **{'CLONES / VARIETIES': df_clean['CLONES / VARIETIES'].str.split(r'[\s,;]+')}
            ).explode('CLONES / VARIETIES', ignore_index=True)
            df_clean = df_clean[df_clean['CLONES / VARIETIES'].str.strip() != '']
            logger.info("Exploded CLONES / VARIETIES column.")

        final_columns = [
            'INDEX',
            'TODAY', 'GARDEN ID', 'ORGANIZATION', 'GARDEN TYPE',
            'ZONE', 'STATE', 'LGA', 'CITY', 'LOCATION DESCRIPTION',
            'LATITUDE', 'LONGITUDE', 'GPS LOCATION',
            'PRODUCTION YEAR', 'YEAR', 'SURVEY DATE',
            'PURPOSE', 'AREA (Ha)', 'TREE COUNT', 'TREE DENSITY (per Ha)',
            'POLYCLONAL', 'CLONES / VARIETIES',
            'SHADE TREES', 'INTERCROPS (Timber)', 'INTERCROPS (Fruit)', 'INTERCROPS (Other)'
        ]
        df_final = df_clean[[col for col in final_columns if col in df_clean.columns]]

        df_final['AREA (Ha)'] = pd.to_numeric(df_final['AREA (Ha)'], errors='coerce')
        df_final['TREE COUNT'] = pd.to_numeric(df_final['TREE COUNT'], errors='coerce')
        df_final['LATITUDE'] = pd.to_numeric(df_final['LATITUDE'], errors='coerce')
        df_final['LONGITUDE'] = pd.to_numeric(df_final['LONGITUDE'], errors='coerce')

        logger.info(f"Final rows: {len(df_final)}")
        cleaned_path = os.path.join(tempfile.gettempdir(), f"{form_id}_cleaned.xlsx")
        df_final.to_excel(cleaned_path, index=False, engine='openpyxl')
        log_step("clean", "complete", f"Cleaned {len(df_final)} rows")
    except Exception as e:
        logger.error(f"Cleaning failed: {e}")
        traceback.print_exc()
        log_step("clean", "failed", str(e))
        sys.exit(1)

    # ──── Step 3: Upload ─────────────────────────────────
    if spreadsheet_key and spreadsheet_key.strip():
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
            scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
            credentials = ServiceAccountCredentials.from_json_keyfile_dict(creds_json, scope)
            client = gspread.authorize(credentials)
            sheet = client.open_by_key(spreadsheet_id).worksheet(sheet_name)

            # Replace inf/-inf/NaN with None
            df_final = df_final.replace([np.inf, -np.inf], np.nan)
            df_final = df_final.where(pd.notnull(df_final), None)

            sheet.clear()
            gd.set_with_dataframe(sheet, df_final)
            logger.info(f"Uploaded {len(df_final)} rows to sheet '{sheet_name}'")
            log_step("upload", "complete", f"Uploaded {len(df_final)} rows")
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            log_step("upload", "failed", str(e))
    else:
        log_step("upload", "complete", "No upload configured")

    if os.path.exists(tmp.name):
        os.unlink(tmp.name)
    if 'cleaned_path' in locals() and os.path.exists(cleaned_path):
        os.unlink(cleaned_path)

    logger.info("Cocoa Seed Garden Pipeline completed successfully")

if __name__ == "__main__":
    main()
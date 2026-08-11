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

        # Column selection
        keep_cols = [
            "heading/field_no",
            "heading/farmer_info/organization",
            "heading/farmer_info/garden_tpe",
            "heading/farmer_info/name",
            "heading/farmer_info/business_name",
            "heading/farmer_info/tel",
            "heading/farmer_info/email",
            "heading/farmer_info/gender",
            "heading/farmer_info/age",
            "heading/farmer_info/country_field",
            "heading/farmer_info/zone",
            "heading/farmer_info/state",
            "heading/farmer_info/city",
            "heading/farmer_info/lga",
            "heading/farmer_info/location",
            "heading/farmer_info/_gps_latitude",
            "heading/farmer_info/_gps_longitude",
            "heading/farmer_info/_gps_altitude",
            "heading/farmer_info/_gps_precision",
            "heading/farmer_info/productionYear",
            # FRIN
            "heading/garden_registration/frin_garden_registration/frin_garden_purpose",
            "heading/garden_registration/frin_garden_registration/frin_year",
            "heading/garden_registration/frin_garden_registration/frin_area",
            "heading/garden_registration/frin_garden_registration/frin_tree",
            "heading/garden_registration/frin_garden_registration/frin_surv_date",
            "heading/garden_registration/frin_garden_registration/frin_shade",
            "heading/garden_registration/frin_garden_registration/crops_timber",
            "heading/garden_registration/frin_garden_registration/crops_fruit",
            "heading/garden_registration/frin_garden_registration/other_crops_shade",
            "heading/garden_registration/frin_garden_registration/variety_produced",
            # CRIN
            "heading/garden_registration/crin_garden_registration/garden_purpose",
            "heading/garden_registration/crin_garden_registration/crin_year",
            "heading/garden_registration/crin_garden_registration/area",
            "heading/garden_registration/crin_garden_registration/tree",
            "heading/garden_registration/crin_garden_registration/surv_date",
            "heading/garden_registration/crin_garden_registration/crop_type",
            "heading/garden_registration/crin_garden_registration/polyclonal",
            "heading/garden_registration/crin_garden_registration/clones",
            "heading/garden_registration/crin_garden_registration/other_variety",
            "heading/garden_registration/crin_garden_registration/crops",
            "heading/garden_registration/crin_garden_registration/crops_shade",
            "heading/garden_registration/crin_garden_registration/crops_timber",
            "heading/garden_registration/crin_garden_registration/crops_fruit",
            "heading/garden_registration/crin_garden_registration/other_crops_shade",
            "heading/garden_registration/crin_garden_registration/crops_specify",
            # Survey
            "heading/survey_information/surveyor",
            "heading/survey_information/surv_name",
            "heading/survey_information/surv_org",
            "heading/survey_information/surv_id",
            "heading/survey_information/surv_date",
        ]
        keep_existing = [c for c in keep_cols if c in df.columns]
        df_clean = df[keep_existing].copy()
        logger.info(f"Selected {len(keep_existing)} columns.")

        # Rename to ALL CAPS
        rename_map = {
            "heading/field_no": "FIELD ID",
            "heading/farmer_info/organization": "ORGANIZATION",
            "heading/farmer_info/garden_tpe": "GARDEN TYPE",
            "heading/farmer_info/name": "NAME",
            "heading/farmer_info/business_name": "BUSINESS NAME",
            "heading/farmer_info/tel": "PHONE",
            "heading/farmer_info/email": "EMAIL",
            "heading/farmer_info/gender": "GENDER",
            "heading/farmer_info/age": "AGE",
            "heading/farmer_info/country_field": "COUNTRY",
            "heading/farmer_info/zone": "ZONE",
            "heading/farmer_info/state": "STATE",
            "heading/farmer_info/city": "CITY",
            "heading/farmer_info/lga": "LGA",
            "heading/farmer_info/location": "LOCATION DESCRIPTION",
            "heading/farmer_info/_gps_latitude": "LATITUDE",
            "heading/farmer_info/_gps_longitude": "LONGITUDE",
            "heading/farmer_info/_gps_altitude": "ALTITUDE",
            "heading/farmer_info/_gps_precision": "PRECISION",
            "heading/farmer_info/productionYear": "PRODUCTION YEAR",
            # FRIN
            "heading/garden_registration/frin_garden_registration/frin_garden_purpose": "FRIN_PURPOSE",
            "heading/garden_registration/frin_garden_registration/frin_year": "FRIN_YEAR",
            "heading/garden_registration/frin_garden_registration/frin_area": "FRIN_AREA",
            "heading/garden_registration/frin_garden_registration/frin_tree": "FRIN_TREE_COUNT",
            "heading/garden_registration/frin_garden_registration/frin_surv_date": "FRIN_SURVEY_DATE",
            "heading/garden_registration/frin_garden_registration/frin_shade": "FRIN_SHADE",
            "heading/garden_registration/frin_garden_registration/crops_timber": "FRIN_TIMBER",
            "heading/garden_registration/frin_garden_registration/crops_fruit": "FRIN_FRUIT",
            "heading/garden_registration/frin_garden_registration/other_crops_shade": "FRIN_OTHER_CROPS",
            "heading/garden_registration/frin_garden_registration/variety_produced": "FRIN_VARIETIES",
            # CRIN
            "heading/garden_registration/crin_garden_registration/garden_purpose": "CRIN_PURPOSE",
            "heading/garden_registration/crin_garden_registration/crin_year": "CRIN_YEAR",
            "heading/garden_registration/crin_garden_registration/area": "CRIN_AREA",
            "heading/garden_registration/crin_garden_registration/tree": "CRIN_TREE_COUNT",
            "heading/garden_registration/crin_garden_registration/surv_date": "CRIN_SURVEY_DATE",
            "heading/garden_registration/crin_garden_registration/crop_type": "CROP_TYPE",
            "heading/garden_registration/crin_garden_registration/polyclonal": "POLYCLONAL",
            "heading/garden_registration/crin_garden_registration/clones": "CRIN_CLONES",
            "heading/garden_registration/crin_garden_registration/other_variety": "CRIN_OTHER_VARIETIES",
            "heading/garden_registration/crin_garden_registration/crops": "CROPS",
            "heading/garden_registration/crin_garden_registration/crops_shade": "CROPS_SHADE",
            "heading/garden_registration/crin_garden_registration/crops_timber": "CROPS_TIMBER",
            "heading/garden_registration/crin_garden_registration/crops_fruit": "CROPS_FRUIT",
            "heading/garden_registration/crin_garden_registration/other_crops_shade": "CROPS_OTHER",
            "heading/garden_registration/crin_garden_registration/crops_specify": "CROPS_SPECIFY",
            # Survey
            "heading/survey_information/surveyor": "SURVEYOR",
            "heading/survey_information/surv_name": "SURVEYOR NAME",
            "heading/survey_information/surv_org": "SURVEYOR ORGANIZATION",
            "heading/survey_information/surv_id": "SURVEYOR ID",
            "heading/survey_information/surv_date": "SURVEY DATE",
        }
        df_clean.rename(columns=rename_map, inplace=True)

        # 1. Add INDEX immediately – before any other processing
        df_clean = df_clean.reset_index(drop=True)
        df_clean.index = df_clean.index + 1
        df_clean.index.name = 'INDEX'
        df_clean = df_clean.reset_index()

        # Fix date columns (FRIN_SURVEY_DATE, etc.)
        date_cols = ['FRIN_SURVEY_DATE', 'CRIN_SURVEY_DATE', 'SURVEY DATE']
        for col in date_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
                df_clean[col] = pd.to_datetime(df_clean[col], unit='D', origin='1899-12-30', errors='coerce')
                df_clean[col] = df_clean[col].dt.strftime('%Y-%m-%d')

        # 2. Text cleaning (Title Case for most)
        text_cols = [
            'GARDEN TYPE', 'NAME', 'BUSINESS NAME',
            'GENDER', 'COUNTRY', 'ZONE', 'STATE', 'CITY', 'LGA',
            'LOCATION DESCRIPTION', 'FRIN_PURPOSE', 'FRIN_SHADE', 'FRIN_TIMBER',
            'FRIN_FRUIT', 'FRIN_OTHER_CROPS', 'FRIN_VARIETIES',
            'CRIN_PURPOSE', 'CROP_TYPE', 'POLYCLONAL', 'CRIN_CLONES',
            'CRIN_OTHER_VARIETIES', 'CROPS', 'CROPS_SHADE', 'CROPS_TIMBER',
            'CROPS_FRUIT', 'CROPS_OTHER', 'CROPS_SPECIFY',
            'SURVEYOR', 'SURVEYOR NAME', 'SURVEYOR ORGANIZATION'
        ]
        for col in text_cols:
            if col in df_clean.columns:
                df_clean[col] = df_clean[col].apply(clean_text)

        # Capitalize ORGANIZATION
        if 'ORGANIZATION' in df_clean.columns:
            df_clean['ORGANIZATION'] = df_clean['ORGANIZATION'].astype(str).str.strip().str.upper()

        # 3. Unified columns (coalesce FRIN/CRIN)
        df_clean['PURPOSE'] = df_clean['FRIN_PURPOSE'].combine_first(df_clean['CRIN_PURPOSE'])
        df_clean['YEAR'] = df_clean['FRIN_YEAR'].combine_first(df_clean['CRIN_YEAR'])
        df_clean['AREA (Ha)'] = pd.to_numeric(df_clean['FRIN_AREA'], errors='coerce').combine_first(
                                pd.to_numeric(df_clean['CRIN_AREA'], errors='coerce'))
        df_clean['TREE COUNT'] = pd.to_numeric(df_clean['FRIN_TREE_COUNT'], errors='coerce').combine_first(
                                 pd.to_numeric(df_clean['CRIN_TREE_COUNT'], errors='coerce'))

        # GPS Location
        df_clean['LATITUDE'] = pd.to_numeric(df_clean['LATITUDE'], errors='coerce')
        df_clean['LONGITUDE'] = pd.to_numeric(df_clean['LONGITUDE'], errors='coerce')
        df_clean['GPS LOCATION'] = df_clean['LATITUDE'].astype(str) + ', ' + df_clean['LONGITUDE'].astype(str)

        # 4. Variety explosion
        variety_cols = ['FRIN_VARIETIES', 'CRIN_CLONES', 'CRIN_OTHER_VARIETIES']
        variety_cols = [c for c in variety_cols if c in df_clean.columns]

        def combine_first_variety(row):
            for col in variety_cols:
                val = row.get(col, None)
                if pd.notna(val) and str(val).strip():
                    return str(val).strip()
            return None

        df_clean['_combined_variety'] = df_clean.apply(combine_first_variety, axis=1)

        def split_varieties(val):
            if pd.isna(val) or str(val).strip() == '':
                return []
            val = str(val).strip().upper()
            tokens = val.split()
            tokens = [t.replace('_', ' ') for t in tokens]
            return tokens

        df_clean['_variety_list'] = df_clean['_combined_variety'].apply(split_varieties)

        df_exploded = df_clean.explode('_variety_list')
        df_exploded['VARIETY'] = df_exploded['_variety_list']
        df_exploded = df_exploded.drop(columns=['_combined_variety', '_variety_list'])

        for col in variety_cols:
            if col in df_exploded.columns:
                df_exploded = df_exploded.drop(columns=[col])

        # 5. Reorder columns
        first_cols = ['INDEX', 'NAME', 'VARIETY']
        other_cols = [c for c in df_exploded.columns if c not in first_cols]
        col_order = first_cols + other_cols
        col_order = [c for c in col_order if c in df_exploded.columns]
        df_final = df_exploded[col_order]

        # Convert INDEX to string to prevent Google Sheets date formatting
        if 'INDEX' in df_final.columns:
            df_final['INDEX'] = df_final['INDEX'].astype(str)

        logger.info(f"Final rows after explosion: {len(df_final)}")

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
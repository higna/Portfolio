"""
Cocoa Shade Tree Registration pipeline.
Two‑step explosion: flag category → species from text column.
Downloads form 858437, cleans, and uploads to Google Sheets.
Usage: python clean_cocoa_shade.py <api_key> <base_url> <form_id> <sheet_name> <creds_path> <spreadsheet_config_path> <spreadsheet_key>
"""
import sys, json, os, tempfile, logging, traceback, re
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
logger = logging.getLogger("clean_cocoa_shade")

def log_step(step: str, status: str, message: str = ""):
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)

def clean_text(val):
    if isinstance(val, str):
        val = val.replace('_', ' ').replace('.', ' ')
        return ' '.join(val.split()).title()
    return val

def split_and_clean(val):
    """Split a space‑ or comma‑separated string, clean each part."""
    if pd.isna(val) or not str(val).strip():
        return []
    val = str(val).strip()
    val = val.replace('_', ' ')
    parts = re.split(r'[;, ]+', val)
    return [p.strip() for p in parts if p.strip()]

def main():
    logger.info("Starting Cocoa Shade Tree Pipeline (flag‑to‑species explosion)")
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

        # 1. Base columns
        base_cols = [
            "begin/field_no",
            "begin/survey_info/calc_farm_name",
            "begin/survey_info/calc_nursery_organization",
            "begin/survey_info/calc_nursery_type",
            "begin/survey_info/collection_purpose",
            "begin/survey_info/geo_information/zone",
            "begin/survey_info/geo_information/state",
            "begin/survey_info/geo_information/lga",
            "begin/survey_info/geo_information/city",
            "begin/survey_info/geo_information/_coordinates_latitude",
            "begin/survey_info/geo_information/_coordinates_longitude",
            "begin/shade_info/shade",
            "begin/shade_info/timber",
            "begin/shade_info/fruit",
            "begin/shade_info/other_shade",
            "begin/production_information/total_number",
            "begin/production_information/year_production",
            "begin/shade_info/seed_source_location/seed_source_state",
            "begin/shade_info/seed_source_location/seed_source_lga",
            "begin/shade_info/seed_source_location/seed_source_city",
        ]
        existing_cols = [c for c in base_cols if c in df.columns]
        df_base = df[existing_cols].copy()

        # 2. Rename to ALL CAPS
        rename_map = {
            "begin/field_no": "FIELD ID",
            "begin/survey_info/calc_farm_name": "NAME",
            "begin/survey_info/calc_nursery_organization": "ORGANIZATION",
            "begin/survey_info/calc_nursery_type": "ENTITY TYPE",
            "begin/survey_info/collection_purpose": "PURPOSE",
            "begin/survey_info/geo_information/zone": "ZONE",
            "begin/survey_info/geo_information/state": "STATE",
            "begin/survey_info/geo_information/lga": "LGA",
            "begin/survey_info/geo_information/city": "CITY",
            "begin/survey_info/geo_information/_coordinates_latitude": "LATITUDE",
            "begin/survey_info/geo_information/_coordinates_longitude": "LONGITUDE",
            "begin/shade_info/shade": "SHADE_FLAG",
            "begin/shade_info/timber": "TIMBER_FLAG",
            "begin/shade_info/fruit": "FRUIT_FLAG",
            "begin/shade_info/other_shade": "OTHER_SHADE_TEXT",
            "begin/production_information/total_number": "TOTAL TREES",
            "begin/production_information/year_production": "YEAR PRODUCED",
            "begin/shade_info/seed_source_location/seed_source_state": "SEED SOURCE STATE",
            "begin/shade_info/seed_source_location/seed_source_lga": "SEED SOURCE LGA",
            "begin/shade_info/seed_source_location/seed_source_city": "SEED SOURCE CITY",
        }
        df_base.rename(columns=rename_map, inplace=True)

        # 3. Clean text columns
        text_cols = ['NAME', 'ORGANIZATION', 'ENTITY TYPE', 'PURPOSE', 'ZONE', 'STATE',
                     'LGA', 'CITY', 'SEED SOURCE STATE', 'SEED SOURCE LGA', 'SEED SOURCE CITY']
        for col in text_cols:
            if col in df_base.columns:
                df_base[col] = df_base[col].apply(clean_text)

        # 4. GPS and numeric conversions
        df_base['LATITUDE'] = pd.to_numeric(df_base['LATITUDE'], errors='coerce')
        df_base['LONGITUDE'] = pd.to_numeric(df_base['LONGITUDE'], errors='coerce')
        df_base['GPS LOCATION'] = df_base['LATITUDE'].astype(str) + ', ' + df_base['LONGITUDE'].astype(str)

        # 5. INDEX (1‑based)
        df_base = df_base.reset_index(drop=True)
        df_base.index = df_base.index + 1
        df_base.index.name = 'INDEX'
        df_base = df_base.reset_index()

        # ---- Step 1: Explode categories based on flags ----
        flag_cols = ['SHADE_FLAG', 'TIMBER_FLAG', 'FRUIT_FLAG']
        flag_cols_existing = [c for c in flag_cols if c in df_base.columns]
        flag_to_category = {
            'SHADE_FLAG': 'Shade',
            'TIMBER_FLAG': 'Timber',
            'FRUIT_FLAG': 'Fruit'
        }

        records = []
        for idx, row in df_base.iterrows():
            base_row = row.to_dict()
            for flag_col in flag_cols_existing:
                flag_val = row.get(flag_col, None)
                # ---- FIX: treat any non‑empty value as category present ----
                if pd.notna(flag_val) and str(flag_val).strip() != '':
                    category = flag_to_category[flag_col]
                    # Determine the text column containing species names
                    if category == 'Shade':
                        text_val = row.get('OTHER_SHADE_TEXT', None)
                    elif category == 'Timber':
                        text_val = row.get('TIMBER_FLAG', None)
                        if pd.isna(text_val) or not str(text_val).strip():
                            text_val = row.get('OTHER_SHADE_TEXT', None)
                    else:  # Fruit
                        text_val = row.get('FRUIT_FLAG', None)
                        if pd.isna(text_val) or not str(text_val).strip():
                            text_val = row.get('OTHER_SHADE_TEXT', None)

                    species_list = split_and_clean(text_val)
                    if species_list:
                        for species in species_list:
                            record = base_row.copy()
                            record['CATEGORY'] = category
                            record['SPECIES'] = clean_text(species)
                            record['QUANTITY'] = 0
                            records.append(record)
                    else:
                        record = base_row.copy()
                        record['CATEGORY'] = category
                        record['SPECIES'] = 'Unspecified'
                        record['QUANTITY'] = 0
                        records.append(record)

        if not records:
            logger.warning("No flagged categories found. Check your flag columns.")
            log_step("clean", "failed", "No flagged data")
            sys.exit(1)

        df_exploded = pd.DataFrame(records)

        # Drop original flag/text columns
        drop_cols = flag_cols_existing + ['OTHER_SHADE_TEXT']
        drop_cols = [c for c in drop_cols if c in df_exploded.columns]
        df_exploded = df_exploded.drop(columns=drop_cols)

        # 6. Reorder columns
        first_cols = ['INDEX', 'FIELD ID', 'NAME', 'ORGANIZATION', 'ENTITY TYPE',
                      'CATEGORY', 'SPECIES']
        other_cols = [c for c in df_exploded.columns if c not in first_cols]
        col_order = first_cols + other_cols
        col_order = [c for c in col_order if c in df_exploded.columns]
        df_final = df_exploded[col_order]

        df_final = df_final.sort_values(['FIELD ID', 'CATEGORY', 'SPECIES'])

        if 'INDEX' in df_final.columns:
            df_final['INDEX'] = df_final['INDEX'].astype(str)

        num_cols = ['LATITUDE', 'LONGITUDE']
        for col in num_cols:
            if col in df_final.columns:
                df_final[col] = pd.to_numeric(df_final[col], errors='coerce')

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

    logger.info("Cocoa Shade Tree Pipeline completed successfully")

if __name__ == "__main__":
    main()
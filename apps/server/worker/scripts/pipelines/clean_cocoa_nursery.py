"""
Cocoa Nursery Production pipeline.
Downloads form 858436, uses explicit year/quantity columns, cleans, and uploads.
Usage: python clean_cocoa_nursery.py <api_key> <base_url> <form_id> <sheet_name> <creds_path> <spreadsheet_config_path> <spreadsheet_key>
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
logger = logging.getLogger("clean_cocoa_nursery")

def log_step(step: str, status: str, message: str = ""):
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)

def clean_text(val):
    if isinstance(val, str):
        val = val.replace('_', ' ').replace('.', ' ')
        return ' '.join(val.split()).title()
    return val

def main():
    logger.info("Starting Cocoa Nursery Pipeline")
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

        keep_cols = [
            "heading/field_no",
            "heading/begin/newRegistration/seed_project",
            "heading/begin/newRegistration/name",
            "heading/begin/newRegistration/organization",
            "heading/begin/zone",
            "heading/begin/state",
            "heading/begin/lga",
            "heading/begin/community",
            "heading/begin/_sec1_coordinates_latitude",
            "heading/begin/_sec1_coordinates_longitude",
            "heading/begin/production_type",
            "heading/begin/year_established",
            "heading/begin/year", "heading/begin/year_1", "heading/begin/year_2", "heading/begin/year_3",
            "heading/begin/rec_0", "heading/begin/rec_1", "heading/begin/rec_2", "heading/begin/rec_3",
            "heading/begin/var_name",
            "heading/grp_stem45/grp_stem45_specify",
            "heading/production_information/total_pods",
            "heading/production_information/total_seedlings",
            "heading/production_information/length",
            "heading/production_information/width",
            "heading/production_information/area_sqm",
            "heading/conclusion/comments",
            "heading/survey_information/surveyor",
            "heading/survey_information/surv_name",
            "heading/survey_information/surv_org",
            "heading/survey_information/surv_date",
        ]
        keep_existing = [c for c in keep_cols if c in df.columns]
        df_clean = df[keep_existing].copy()
        logger.info(f"Selected {len(keep_existing)} columns.")

        rename_map = {
            "heading/field_no": "FIELD ID",
            "heading/begin/newRegistration/seed_project": "SEED PROJECT",
            "heading/begin/newRegistration/name": "NAME",
            "heading/begin/newRegistration/organization": "ORGANIZATION",
            "heading/begin/zone": "ZONE",
            "heading/begin/state": "STATE",
            "heading/begin/lga": "LGA",
            "heading/begin/community": "COMMUNITY",
            "heading/begin/_sec1_coordinates_latitude": "LATITUDE",
            "heading/begin/_sec1_coordinates_longitude": "LONGITUDE",
            "heading/begin/production_type": "NURSERY TYPE",
            "heading/begin/year_established": "YEAR ESTABLISHED",
            "heading/begin/year": "PROD_YEAR_2025",
            "heading/begin/year_1": "PROD_YEAR_2024",
            "heading/begin/year_2": "PROD_YEAR_2023",
            "heading/begin/year_3": "PROD_YEAR_2022",
            "heading/begin/rec_0": "PROD_QTY_2025",
            "heading/begin/rec_1": "PROD_QTY_2024",
            "heading/begin/rec_2": "PROD_QTY_2023",
            "heading/begin/rec_3": "PROD_QTY_2022",
            "heading/begin/var_name": "VARIETY",
            "heading/grp_stem45/grp_stem45_specify": "VARIETY_OTHER",
            "heading/production_information/total_pods": "TOTAL PODS",
            "heading/production_information/total_seedlings": "TOTAL SEEDLINGS",
            "heading/production_information/length": "LENGTH (m)",
            "heading/production_information/width": "WIDTH (m)",
            "heading/production_information/area_sqm": "AREA (sqm)",
            "heading/conclusion/comments": "COMMENTS",
            "heading/survey_information/surveyor": "SURVEYOR",
            "heading/survey_information/surv_name": "SURVEYOR NAME",
            "heading/survey_information/surv_org": "SURVEYOR ORGANIZATION",
            "heading/survey_information/surv_date": "SURVEY DATE",
        }
        df_clean.rename(columns=rename_map, inplace=True)

        # 1. INDEX
        df_clean = df_clean.reset_index(drop=True)
        df_clean.index = df_clean.index + 1
        df_clean.index.name = 'INDEX'
        df_clean = df_clean.reset_index()

        # 2. Text cleaning
        text_cols = ['SEED PROJECT', 'NAME', 'ORGANIZATION', 'ZONE', 'STATE', 'LGA', 'COMMUNITY',
                     'NURSERY TYPE', 'COMMENTS', 'SURVEYOR', 'SURVEYOR NAME', 'SURVEYOR ORGANIZATION']
        for col in text_cols:
            if col in df_clean.columns:
                df_clean[col] = df_clean[col].apply(clean_text)

        if 'ORGANIZATION' in df_clean.columns:
            df_clean['ORGANIZATION'] = df_clean['ORGANIZATION'].astype(str).str.strip().str.upper()

        # 3. Derived columns
        df_clean['LATITUDE'] = pd.to_numeric(df_clean['LATITUDE'], errors='coerce')
        df_clean['LONGITUDE'] = pd.to_numeric(df_clean['LONGITUDE'], errors='coerce')
        df_clean['GPS LOCATION'] = df_clean['LATITUDE'].astype(str) + ', ' + df_clean['LONGITUDE'].astype(str)
        df_clean['AREA (ha)'] = df_clean['AREA (sqm)'] / 10000.0
        df_clean['SEEDLING DENSITY (per ha)'] = df_clean['TOTAL SEEDLINGS'] / df_clean['AREA (ha)']

        # 4. Variety – rename originals first
        if 'VARIETY' in df_clean.columns:
            df_clean.rename(columns={'VARIETY': '_orig_variety'}, inplace=True)
        if 'VARIETY_OTHER' in df_clean.columns:
            df_clean.rename(columns={'VARIETY_OTHER': '_orig_variety_other'}, inplace=True)

        def combine_varieties(row):
            parts = []
            if pd.notna(row.get('_orig_variety', None)):
                parts.append(str(row['_orig_variety']).strip())
            if pd.notna(row.get('_orig_variety_other', None)):
                parts.append(str(row['_orig_variety_other']).strip())
            return ' '.join(parts) if parts else None

        df_clean['_combined_variety'] = df_clean.apply(combine_varieties, axis=1)

        # 5. Clean, split ONLY on spaces, then replace underscores
        def clean_split(val):
            if pd.isna(val) or not str(val).strip():
                return []
            val = str(val).strip().upper()          # uppercase only, no underscore replacement yet
            tokens = val.split()                    # split on any whitespace (spaces)
            # After splitting, replace underscores in each token with spaces
            tokens = [t.replace('_', ' ') for t in tokens]
            return tokens

        df_clean['_variety_list'] = df_clean['_combined_variety'].apply(clean_split)
        df_exploded = df_clean.explode('_variety_list')
        df_exploded['VARIETY'] = df_exploded['_variety_list']
        df_exploded.drop(columns=['_combined_variety', '_variety_list',
                                  '_orig_variety', '_orig_variety_other'], inplace=True, errors='ignore')

        # 6. Reorder
        first_cols = ['INDEX', 'NAME', 'VARIETY']
        other_cols = [c for c in df_exploded.columns if c not in first_cols]
        col_order = first_cols + other_cols
        col_order = [c for c in col_order if c in df_exploded.columns]
        df_final = df_exploded[col_order]

        if 'INDEX' in df_final.columns:
            df_final['INDEX'] = df_final['INDEX'].astype(str)

        # 7. Numeric conversions
        num_cols = ['LATITUDE', 'LONGITUDE', 'TOTAL PODS', 'TOTAL SEEDLINGS',
                    'LENGTH (m)', 'WIDTH (m)', 'AREA (sqm)', 'AREA (ha)',
                    'SEEDLING DENSITY (per ha)']
        for col in num_cols:
            if col in df_final.columns:
                df_final[col] = pd.to_numeric(df_final[col], errors='coerce')

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

    logger.info("Cocoa Nursery Pipeline completed successfully")

if __name__ == "__main__":
    main()
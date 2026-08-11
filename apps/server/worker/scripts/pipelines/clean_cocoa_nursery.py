"""
Cocoa Nursery Production pipeline.
Downloads form 858436, unpivots year/rec pairs, cleans, and uploads to Google Sheets.
Usage: python clean_cocoa_nursery.py <api_key> <base_url> <form_id> <sheet_name> <creds_path> <spreadsheet_config_path> <spreadsheet_key>
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

        base_cols = [
            "heading/field_no",
            "heading/begin/newRegistration/organization",
            "heading/begin/newRegistration/seed_project",
            "heading/begin/zone",
            "heading/begin/state",
            "heading/begin/lga",
            "heading/begin/community",
            "heading/begin/_sec1_coordinates_latitude",
            "heading/begin/_sec1_coordinates_longitude",
            "heading/begin/production_type",
            "heading/begin/year_established",
            "heading/begin/var_name",
            "heading/grp_stem0/seed_source0",
            "heading/grp_stem0/specify_seedtype0",
            "heading/grp_stem/seed_source",
            "heading/grp_stem/specify_seedtype",
            "heading/production_information/total_pods",
            "heading/production_information/total_seedlings",
            "heading/production_information/length",
            "heading/production_information/width",
            "heading/production_information/area_sqm",
        ]
        existing_base = [c for c in base_cols if c in df.columns]
        df_base = df[existing_base].copy()

        year_cols = ['heading/begin/year', 'heading/begin/year_1', 'heading/begin/year_2', 'heading/begin/year_3']
        rec_cols  = ['heading/begin/rec_0', 'heading/begin/rec_1', 'heading/begin/rec_2', 'heading/begin/rec_3']
        year_cols = [c for c in year_cols if c in df.columns]
        rec_cols  = [c for c in rec_cols if c in df.columns]

        records = []
        for idx, row in df.iterrows():
            nursery_id = row['heading/field_no']
            for i in range(min(len(year_cols), len(rec_cols))):
                year_val = row[year_cols[i]]
                rec_val  = row[rec_cols[i]]
                if pd.isna(year_val) or pd.isna(rec_val):
                    continue
                record = {
                    'NURSERY ID': nursery_id,
                    'PRODUCTION YEAR': int(year_val) if not pd.isna(year_val) else None,
                    'PRODUCTION QUANTITY': int(rec_val) if not pd.isna(rec_val) else None,
                    'ORGANIZATION': row.get('heading/begin/newRegistration/organization', None),
                    'SEED PROJECT': row.get('heading/begin/newRegistration/seed_project', None),
                    'ZONE': row.get('heading/begin/zone', None),
                    'STATE': row.get('heading/begin/state', None),
                    'LGA': row.get('heading/begin/lga', None),
                    'COMMUNITY': row.get('heading/begin/community', None),
                    'LATITUDE': row.get('heading/begin/_sec1_coordinates_latitude', None),
                    'LONGITUDE': row.get('heading/begin/_sec1_coordinates_longitude', None),
                    'NURSERY TYPE': row.get('heading/begin/production_type', None),
                    'YEAR ESTABLISHED': row.get('heading/begin/year_established', None),
                    'VARIETY': row.get('heading/begin/var_name', None),
                    'SEED_SOURCE_0': row.get('heading/grp_stem0/seed_source0', None),
                    'SEED_TYPE_0': row.get('heading/grp_stem0/specify_seedtype0', None),
                    'SEED_SOURCE': row.get('heading/grp_stem/seed_source', None),
                    'SEED_TYPE': row.get('heading/grp_stem/specify_seedtype', None),
                    'TOTAL PODS': row.get('heading/production_information/total_pods', None),
                    'TOTAL SEEDLINGS': row.get('heading/production_information/total_seedlings', None),
                    'LENGTH (m)': row.get('heading/production_information/length', None),
                    'WIDTH (m)': row.get('heading/production_information/width', None),
                    'AREA (sqm)': row.get('heading/production_information/area_sqm', None),
                }
                records.append(record)

        df_long = pd.DataFrame(records)
        logger.info(f"Unpivoted to {len(df_long)} rows")

        # 1. Add INDEX immediately – before any other processing
        df_long = df_long.reset_index(drop=True)
        df_long.index = df_long.index + 1
        df_long.index.name = 'INDEX'
        df_long = df_long.reset_index()

        # Capitalize ORGANIZATION
        if 'ORGANIZATION' in df_long.columns:
            df_long['ORGANIZATION'] = df_long['ORGANIZATION'].astype(str).str.strip().str.upper()

        df_long['SEED_SOURCE_MAIN'] = df_long['SEED_SOURCE'].combine_first(df_long['SEED_SOURCE_0'])
        df_long['SEED_TYPE_MAIN']   = df_long['SEED_TYPE'].combine_first(df_long['SEED_TYPE_0'])

        df_long['AREA (ha)'] = df_long['AREA (sqm)'] / 10000.0
        df_long['SEEDLING DENSITY (per ha)'] = df_long['TOTAL SEEDLINGS'] / df_long['AREA (ha)']
        df_long['GPS LOCATION'] = df_long['LATITUDE'].astype(str) + ', ' + df_long['LONGITUDE'].astype(str)

        # Text cleaning
        text_cols = [
            'SEED PROJECT', 'ZONE', 'STATE', 'LGA', 'COMMUNITY',
            'NURSERY TYPE', 'VARIETY', 'SEED_SOURCE_MAIN', 'SEED_TYPE_MAIN'
        ]
        for col in text_cols:
            if col in df_long.columns:
                df_long[col] = df_long[col].apply(clean_text)

        num_cols = ['LATITUDE', 'LONGITUDE', 'TOTAL PODS', 'TOTAL SEEDLINGS',
                    'LENGTH (m)', 'WIDTH (m)', 'AREA (sqm)', 'AREA (ha)',
                    'PRODUCTION YEAR', 'PRODUCTION QUANTITY']
        for col in num_cols:
            if col in df_long.columns:
                df_long[col] = pd.to_numeric(df_long[col], errors='coerce')

        # 2. Variety explosion – capitalize → split → explode → replace _ with space
        if 'VARIETY' in df_long.columns:
            def split_varieties(val):
                if pd.isna(val) or str(val).strip() == '':
                    return []
                val = str(val).strip().upper()
                tokens = val.split()
                tokens = [t.replace('_', ' ') for t in tokens]
                return tokens

            df_long['_variety_list'] = df_long['VARIETY'].apply(split_varieties)
            df_long = df_long.explode('_variety_list')
            df_long['VARIETY'] = df_long['_variety_list']
            df_long = df_long.drop(columns=['_variety_list'])
            logger.info("Exploded VARIETY column.")

        final_cols = [
            'INDEX',
            'NURSERY ID', 'ORGANIZATION', 'SEED PROJECT',
            'ZONE', 'STATE', 'LGA', 'COMMUNITY',
            'LATITUDE', 'LONGITUDE', 'GPS LOCATION',
            'NURSERY TYPE', 'YEAR ESTABLISHED',
            'PRODUCTION YEAR', 'PRODUCTION QUANTITY',
            'VARIETY', 'SEED_SOURCE_MAIN', 'SEED_TYPE_MAIN',
            'TOTAL PODS', 'TOTAL SEEDLINGS',
            'AREA (sqm)', 'AREA (ha)', 'SEEDLING DENSITY (per ha)'
        ]
        df_final = df_long[[c for c in final_cols if c in df_long.columns]]
        df_final = df_final.sort_values(['NURSERY ID', 'PRODUCTION YEAR'])

        # Convert INDEX to string to prevent Google Sheets date formatting
        if 'INDEX' in df_final.columns:
            df_final['INDEX'] = df_final['INDEX'].astype(str)

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
"""
Cocoa Shade Tree Registration pipeline.
Downloads form 858437, unpivots species counts, cleans, and uploads to Google Sheets.
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

def main():
    logger.info("Starting Cocoa Shade Tree Pipeline")
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

        # Base columns (identifiers)
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
            "begin/production_information/total_number",
            "begin/production_information/year_production",
            "begin/shade_info/seed_source_location/seed_source_state",
            "begin/shade_info/other_shade",
        ]
        base_existing = [c for c in base_cols if c in df.columns]

        # Species count columns (unpivot)
        species_cols = [c for c in df.columns if c.endswith('_number') and 'begin/shade_info/' in c]
        if not species_cols:
            logger.warning("No species count columns found.")
            log_step("clean", "failed", "No species columns")
            sys.exit(1)

        # Melt – unpivot species counts
        df_melted = pd.melt(
            df,
            id_vars=base_existing,
            value_vars=species_cols,
            var_name='SPECIES_RAW',
            value_name='TREE_COUNT'
        )
        logger.info(f"Melted to {len(df_melted)} rows")

        # Extract clean species name
        def extract_species(raw):
            parts = raw.split('/')
            if len(parts) >= 3:
                species = parts[2]
                species = re.sub(r'_number$', '', species)
                return species.replace('_', ' ').upper()
            return raw

        df_melted['SPECIES'] = df_melted['SPECIES_RAW'].apply(extract_species)

        # Drop rows with missing/zero counts
        df_melted['TREE_COUNT'] = pd.to_numeric(df_melted['TREE_COUNT'], errors='coerce')
        df_melted = df_melted[df_melted['TREE_COUNT'].notna() & (df_melted['TREE_COUNT'] > 0)]
        logger.info(f"After dropping zero/missing counts: {len(df_melted)} rows")

        # Rename base columns to ALL CAPS
        rename_map = {
            "begin/field_no": "FIELD ID",
            "begin/survey_info/calc_farm_name": "RECIPIENT NAME",
            "begin/survey_info/calc_nursery_organization": "ORGANIZATION",
            "begin/survey_info/calc_nursery_type": "ENTITY TYPE",
            "begin/survey_info/collection_purpose": "PURPOSE",
            "begin/survey_info/geo_information/zone": "ZONE",
            "begin/survey_info/geo_information/state": "STATE",
            "begin/survey_info/geo_information/lga": "LGA",
            "begin/survey_info/geo_information/city": "CITY",
            "begin/survey_info/geo_information/_coordinates_latitude": "LATITUDE",
            "begin/survey_info/geo_information/_coordinates_longitude": "LONGITUDE",
            "begin/shade_info/shade": "SHADE TREES FLAG",
            "begin/shade_info/timber": "TIMBER TREES FLAG",
            "begin/shade_info/fruit": "FRUIT TREES FLAG",
            "begin/production_information/total_number": "TOTAL TREES",
            "begin/production_information/year_production": "YEAR PRODUCED",
            "begin/shade_info/seed_source_location/seed_source_state": "SEED SOURCE STATE",
            "begin/shade_info/other_shade": "OTHER SHADE (TEXT)",
        }
        df_melted.rename(columns=rename_map, inplace=True)

        # 1. Add INDEX immediately (before further processing)
        df_melted = df_melted.reset_index(drop=True)
        df_melted.index = df_melted.index + 1
        df_melted.index.name = 'INDEX'
        df_melted = df_melted.reset_index()

        # 2. Clean text columns (Title Case)
        text_cols = [
            'RECIPIENT NAME', 'ORGANIZATION', 'ENTITY TYPE', 'PURPOSE',
            'ZONE', 'STATE', 'LGA', 'CITY', 'SEED SOURCE STATE',
            'SHADE TREES FLAG', 'TIMBER TREES FLAG', 'FRUIT TREES FLAG',
            'OTHER SHADE (TEXT)'
        ]
        for col in text_cols:
            if col in df_melted.columns:
                df_melted[col] = df_melted[col].apply(clean_text)

        # ORGANIZATION → uppercase
        if 'ORGANIZATION' in df_melted.columns:
            df_melted['ORGANIZATION'] = df_melted['ORGANIZATION'].astype(str).str.strip().str.upper()

        # 3. Derived columns
        df_melted['LATITUDE'] = pd.to_numeric(df_melted['LATITUDE'], errors='coerce')
        df_melted['LONGITUDE'] = pd.to_numeric(df_melted['LONGITUDE'], errors='coerce')
        df_melted['GPS LOCATION'] = df_melted['LATITUDE'].astype(str) + ', ' + df_melted['LONGITUDE'].astype(str)

        # 4. Reorder columns
        first_cols = ['INDEX', 'FIELD ID', 'RECIPIENT NAME', 'ORGANIZATION', 'ENTITY TYPE']
        geo_cols = ['ZONE', 'STATE', 'LGA', 'CITY', 'LATITUDE', 'LONGITUDE', 'GPS LOCATION']
        info_cols = ['PURPOSE', 'TOTAL TREES', 'YEAR PRODUCED', 'SEED SOURCE STATE']
        species_cols_clean = ['SPECIES', 'TREE_COUNT']
        flag_cols = ['SHADE TREES FLAG', 'TIMBER TREES FLAG', 'FRUIT TREES FLAG', 'OTHER SHADE (TEXT)']

        order = first_cols + geo_cols + info_cols + species_cols_clean + flag_cols
        order = [c for c in order if c in df_melted.columns]
        df_final = df_melted[order]

        # Convert INDEX to string to prevent Google Sheets date formatting
        if 'INDEX' in df_final.columns:
            df_final['INDEX'] = df_final['INDEX'].astype(str)

        # Ensure numeric columns are proper
        num_cols = ['LATITUDE', 'LONGITUDE', 'TOTAL TREES', 'YEAR PRODUCED', 'TREE_COUNT']
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

    logger.info("Cocoa Shade Tree Pipeline completed successfully")

if __name__ == "__main__":
    main()
import os, json
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import gspread_dataframe as gd

# Paste your actual values or read from environment
creds_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
spreadsheet_id = "1S-KaVd4Ih-wD8j7_UDiNs6eG3e_pV97OS2yLc8etx6Y"
sheet_name = "CST_Test"

if not creds_json:
    raise ValueError("GOOGLE_SERVICE_ACCOUNT_JSON not set")

scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
credentials = ServiceAccountCredentials.from_json_keyfile_dict(json.loads(creds_json), scope)
client = gspread.authorize(credentials)

# Open the sheet and the specific worksheet
sheet = client.open_by_key(spreadsheet_id).worksheet(sheet_name)

# Create a small test DataFrame
df = pd.DataFrame({"Name": ["Alice", "Bob"], "Age": [30, 25]})

# Clear existing content and upload
sheet.clear()
gd.set_with_dataframe(sheet, df)

print("Test upload successful. Check your Google Sheet.")
"""
Generate an Excel template for any Seed Tracker / ONA form.
Falls back to the Seed Tracker overview page if the direct Enketo URL fails.
Usage: python generate_form_template.py <api_key> <base_url> <form_id> <output_path>
"""

import sys, json, os, logging, time, re
import pandas as pd
import requests
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)-5s] %(name)s - %(message)s"
)
logger = logging.getLogger("generate_form_template")

SEEDTRACKER_URL = os.environ.get("SEEDTRACKER_URL", "https://data.seedtracker.org")
USERNAME = os.environ.get("SEEDTRACKER_USERNAME", "")
PASSWORD = os.environ.get("SEEDTRACKER_PASSWORD", "")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "..", "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def log_step(step, status, message=""):
    print(json.dumps({"step": step, "status": status, "message": message}), flush=True)


def scrape_form_fields(page, timeout=30000):
    """Wait for the Enketo form and return list of (field_name, hint) and set of required names."""
    try:
        page.wait_for_selector(
            "[name^='/data/'], form.or-form, section.paper", timeout=timeout
        )
        logger.info("Form fields detected")
    except PlaywrightTimeout:
        page.screenshot(path=os.path.join(OUTPUT_DIR, "form_debug.png"))
        return None, None

    fields = []
    seen_names = set()
    required_names = set()

    for el in page.query_selector_all("[name^='/data/']"):
        try:
            name = el.get_attribute("name")
            if not name:
                continue
            field_name = name.replace("/data/", "", 1)

            # Skip group headings (they often have the name but no input element)
            tag = el.evaluate("el => el.tagName.toLowerCase()")
            if tag in ("fieldset", "legend", "div", "span"):
                # Groups might have the name but aren't real fields
                continue

            # Deduplicate – only keep the first element for a given field name
            if field_name in seen_names:
                continue
            seen_names.add(field_name)

            input_type = el.get_attribute("type") or ""
            hint_parts = []

            # Required check
            if el.get_attribute("aria-required") or el.get_attribute("required"):
                hint_parts.append("❗ REQUIRED")
                required_names.add(field_name)

            # Extract options
            if tag == "select":
                opts = el.evaluate("""el => Array.from(el.options)
                         .map(o => (o.textContent || o.label || '').trim())
                         .filter(t => t)""")
                hint_parts.append(
                    f"Type: {'select_multiple' if el.get_attribute('multiple') else 'select_one'}"
                )
                if opts:
                    hint_parts.append(f"Options: {', '.join(opts)}")
            elif input_type == "radio":
                labels = page.query_selector_all(f'label:has(input[name="{name}"])')
                opts = [lbl.inner_text().strip() for lbl in labels]
                hint_parts.append("Type: select_one")
                if opts:
                    hint_parts.append(f"Options: {', '.join(opts)}")
            elif input_type == "checkbox":
                labels = page.query_selector_all(f'label:has(input[name="{name}"])')
                opts = [lbl.inner_text().strip() for lbl in labels]
                if len(opts) > 1:
                    hint_parts.append("Type: select_multiple")
                    hint_parts.append(f"Options: {', '.join(opts)}")
                else:
                    hint_parts.append("Type: boolean (check)")
            elif input_type in ("date", "datetime-local"):
                hint_parts.append("Type: date | Format: YYYY-MM-DD")
            elif input_type == "file":
                hint_parts.append("Type: image | Path to image file (optional)")
            elif input_type in ("number", "integer", "decimal"):
                hint_parts.append("Type: numeric")
            else:
                hint_parts.append(f"Type: {input_type or 'text'}")

            fields.append((field_name, " | ".join(hint_parts)))

        except Exception as e:
            logger.warning(f"Error scraping field {name}: {e}")
            continue

    return fields, required_names


def main():
    logger.info("Starting template generation")
    if len(sys.argv) < 5:
        log_step("error", "failed", "Missing arguments")
        sys.exit(1)

    api_key, base_url, form_id, output_path = sys.argv[1:5]

    # 1. Get form details from ONA API
    log_step("fetch", "running", "Fetching form details from ONA…")
    try:
        resp = requests.get(
            f"{base_url}/forms/{form_id}", headers={"Authorization": f"Token {api_key}"}
        )
        if resp.status_code != 200:
            log_step("fetch", "failed", f"HTTP {resp.status_code}")
            sys.exit(1)
        form_data = resp.json()
        enketo_url = form_data.get("enketo_url")
        project_id = form_data.get("project") or form_data.get("project_id")
        if not enketo_url:
            log_step("fetch", "failed", "No Enketo URL in form details")
            sys.exit(1)
        logger.info(f"ONA Enketo URL: {enketo_url}, project: {project_id}")
        log_step("fetch", "complete", "Got form details")
    except Exception as e:
        log_step("fetch", "failed", str(e))
        sys.exit(1)

    # 2. Try direct Enketo URL (with domain swap) using Playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Login to Seed Tracker
        if USERNAME and PASSWORD:
            page.goto(f"{SEEDTRACKER_URL}/login")
            page.fill('input[name="username"]', USERNAME)
            page.fill('input[name="password"]', PASSWORD)
            page.click('button[type="submit"]')
            try:
                page.wait_for_selector("#home-link", timeout=15000)
                logger.info("Login successful")
            except PlaywrightTimeout:
                logger.warning("Login may have failed")

        final_enketo_url = None

        # --- Attempt 1: swap domain and try ---
        if "enketo.ona.io" in enketo_url:
            swapped = enketo_url.replace("enketo.ona.io", "enketo.seedtracker.org")
            logger.info(f"Trying swapped URL: {swapped}")
            page.goto(swapped, wait_until="networkidle", timeout=60000)
            body_text = page.inner_text("body")
            if (
                "Loading Error" not in body_text
                and "Survey with this ID not found" not in body_text
            ):
                final_enketo_url = swapped
                logger.info("Direct Enketo URL works")
            else:
                logger.warning("Swapped URL failed")

        # --- Attempt 2: use Seed Tracker overview page ---
        if not final_enketo_url and project_id:
            # project_id could be a full URL like 'https://api.ona.io/api/v1/projects/261878'
            # extract just the numeric ID
            if isinstance(project_id, str):
                match = re.search(r"(\d+)$", project_id)
                if match:
                    project_id = match.group(1)
            overview_url = f"{SEEDTRACKER_URL}/seedtracker/{project_id}/{form_id}"
            logger.info(f"Trying overview page: {overview_url}")
            page.goto(overview_url, wait_until="networkidle")
            enketo_link = page.query_selector('a[href*="enketo.seedtracker.org"]')
            if enketo_link:
                final_enketo_url = enketo_link.get_attribute("href")
                logger.info(f"Found Enketo link on overview: {final_enketo_url}")

        # --- Attempt 3: fallback to original ONA URL ---
        if not final_enketo_url:
            final_enketo_url = enketo_url
            logger.warning("Falling back to original ONA Enketo URL")

        # Navigate to final URL and scrape
        logger.info(f"Loading Enketo form: {final_enketo_url}")
        page.goto(final_enketo_url, wait_until="networkidle", timeout=60000)

        fields, required_names = scrape_form_fields(page)
        if not fields:
            logger.error("Could not scrape fields")
            browser.close()
            log_step("scrape", "failed", "No fields found")
            sys.exit(1)

        logger.info(f"Scraped {len(fields)} fields, {len(required_names)} required")
        log_step("scrape", "complete", f"Found {len(fields)} fields")

        browser.close()

    # 3. Build Excel
    log_step("save", "running", "Creating Excel file…")
    header_names, header_hints = zip(*fields) if fields else ([], [])
    pd.DataFrame([header_names, header_hints]).to_excel(
        output_path, index=False, header=False
    )
    logger.info(f"Template saved to {output_path}")
    log_step("save", "complete", output_path)
    logger.info("Template generation completed")


if __name__ == "__main__":
    main()

"""
List all ONA forms accessible with the given API key.
Usage: python list_ona_forms.py <api_key> <base_url>
Outputs JSON array of forms.
"""

import sys
import json
import requests


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments: api_key base_url"}))
        sys.exit(1)

    api_key = sys.argv[1]
    base_url = sys.argv[2]
    headers = {"Authorization": f"Token {api_key}"}
    url = f"{base_url}/forms"

    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        forms = response.json()
        simplified = [
            {
                "formid": f["formid"],
                "id_string": f["id_string"],
                "title": f["title"],
                "description": f.get("description", ""),
                "num_of_submissions": f.get("num_of_submissions", 0),
            }
            for f in forms
        ]
        print(json.dumps(simplified))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()

import json
import urllib.request

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties?select=id"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Prefer": "count=exact",
    "Range": "0-0"
}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        content_range = response.headers.get("Content-Range")
        print("Content-Range:", content_range)
        if content_range and "/" in content_range:
            total_count = content_range.split("/")[-1]
            print("Total count from header:", total_count)
        else:
            data = json.loads(response.read().decode('utf-8'))
            print("Data length returned:", len(data))
except Exception as e:
    print("Error:", e)

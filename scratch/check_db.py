import requests
import json

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
}

# 1. source 별 개수
res = requests.get(f"{url}?select=source", headers=headers)
if res.status_code == 200:
    data = res.json()
    counts = {}
    for d in data:
        s = d.get('source')
        counts[s] = counts.get(s, 0) + 1
    print("Source counts:", counts)
else:
    print("Failed to fetch sources:", res.status_code, res.text)

# 2. ptype 목록 일부 확인
res2 = requests.get(f"{url}?select=ptype", headers=headers)
if res2.status_code == 200:
    data = res2.json()
    ptypes = {}
    for d in data:
        p = d.get('ptype')
        ptypes[p] = ptypes.get(p, 0) + 1
    print("Ptype counts (top 20):")
    sorted_ptypes = sorted(ptypes.items(), key=lambda x: x[1], reverse=True)
    for p, c in sorted_ptypes[:20]:
        print(f"  {p}: {c}")
else:
    print("Failed to fetch ptypes:", res2.status_code, res2.text)

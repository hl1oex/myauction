import json
import os

log_path = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\b02c274b-c696-4bd3-8951-a0c1238c6855\.system_generated\logs\transcript.jsonl"
out_dir = r"d:\BackUp\OneDrive\AI공부\Real estate auction\tools\extracted"
os.makedirs(out_dir, exist_ok=True)

with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

block_idx = 0

def extract_strings(obj):
    global block_idx
    if isinstance(obj, str):
        if len(obj) > 80000:
            print(f"Found a big string of length {len(obj)}")
            out_file = os.path.join(out_dir, f"block_{block_idx}.txt")
            with open(out_file, 'w', encoding='utf-8') as out:
                out.write(obj)
            print(f"Saved block {block_idx} to {out_file}")
            block_idx += 1
            
    elif isinstance(obj, dict):
        for k, v in obj.items():
            extract_strings(v)
            
    elif isinstance(obj, list):
        for item in obj:
            extract_strings(item)

for i, line in enumerate(lines):
    try:
        data = json.loads(line)
        extract_strings(data)
    except Exception as e:
        continue

print("Extraction done!")

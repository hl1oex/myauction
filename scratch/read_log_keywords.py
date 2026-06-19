# -*- coding: utf-8 -*-
import json
import os
import sys

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    p = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\8284c596-fdad-4b72-9792-b472c69e906b\.system_generated\logs\transcript.jsonl"
    if not os.path.exists(p):
        print("Log file not found.")
        return

    print("[*] Printing all user requests containing 'AI'...")
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f):
            try:
                data = json.loads(line)
                source = data.get("source", "")
                step_type = data.get("type", "")
                content = data.get("content", "")
                
                if source == "USER_EXPLICIT" or step_type == "USER_INPUT":
                    if "ai" in content.lower():
                        print(f"Step {data.get('step_index', idx)}: {content.strip()}")
                        print("-" * 50)
            except Exception:
                continue

if __name__ == "__main__":
    main()

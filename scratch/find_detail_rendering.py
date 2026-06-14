# -*- coding: utf-8 -*-
with open("index.html", "r", encoding="utf-8") as f:
    for idx, line in enumerate(f, 1):
        if "complex_info" in line or "recent_deals" in line or "elementary_school" in line:
            if "function" not in line and "__METADATA__" not in line:
                print(f"Line {idx}: {line.strip()[:150]}")

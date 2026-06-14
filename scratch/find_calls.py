# -*- coding: utf-8 -*-
with open("index.html", "r", encoding="utf-8") as f:
    for idx, line in enumerate(f, 1):
        if "enrichPropertyData" in line:
            print(f"Line {idx}: {line.strip()}")

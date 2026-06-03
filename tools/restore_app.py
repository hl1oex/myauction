import json
import os
import re

log_path = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\b02c274b-c696-4bd3-8951-a0c1238c6855\.system_generated\logs\transcript.jsonl"
output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\src\app.py"

if not os.path.exists(log_path):
    print("Log file not found")
    exit(1)

with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total log lines: {len(lines)}")

def find_longest_code(obj):
    longest_str = ""
    
    if isinstance(obj, str):
        if "import streamlit as st" in obj and "def get_legal_risk_warning" in obj:
            return obj
        return ""
        
    if isinstance(obj, dict):
        for k, v in obj.items():
            res = find_longest_code(v)
            if len(res) > len(longest_str):
                longest_str = res
                
    if isinstance(obj, list):
        for item in obj:
            res = find_longest_code(item)
            if len(res) > len(longest_str):
                longest_str = res
                
    return longest_str

found = False
for idx, line in enumerate(reversed(lines)):
    try:
        data = json.loads(line)
        code = find_longest_code(data)
        if code and len(code) > 100000:
            lines_in_code = code.splitlines()
            cleaned_lines = []
            has_line_numbers = False
            
            pattern = re.compile(r'^\s*\d+\s*:\s*(.*)$')
            
            test_lines = [l for l in lines_in_code[:50] if l.strip()]
            match_count = sum(1 for l in test_lines if pattern.match(l))
            
            if match_count > 10:
                has_line_numbers = True
                
            if has_line_numbers:
                print("Line numbers detected. Cleaning them...")
                for lic in lines_in_code:
                    m = pattern.match(lic)
                    if m:
                        cleaned_lines.append(m.group(1))
                    else:
                        cleaned_lines.append(lic)
            else:
                cleaned_lines = lines_in_code
                
            restored_code = "\n".join(cleaned_lines)
            with open(output_path, 'w', encoding='utf-8') as out:
                out.write(restored_code)
            print(f"SUCCESS! Restored code of length {len(restored_code)} from log line {len(lines) - idx}")
            found = True
            break
    except Exception as e:
        continue

if not found:
    print("Could not find full app.py inside logs.")

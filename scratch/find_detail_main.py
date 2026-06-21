import re
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

filepath = "mobile-app/src/screens/DetailScreen.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# 3000 라인부터 5000 라인까지 onBack 이나 SafeAreaView 이나 ScrollView 검색
for idx in range(3000, min(5000, len(lines))):
    line = lines[idx]
    if "onBack" in line or "SafeAreaView" in line or "ScrollView" in line or "header" in line:
        if "styles." in line or "TouchableOpacity" in line or "View" in line or "Text" in line:
            print(f"Line {idx+1}: {line.strip()}")

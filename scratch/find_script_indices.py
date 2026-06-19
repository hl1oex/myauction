# -*- coding: utf-8 -*-
import re

test_str1 = "'https://action-b8c75.web.app/'"
test_str2 = '"https://www.courtauction.go.kr"'

pattern = re.compile(
    r'("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|`(?:\\.|[^`\\])*`|'  # 문자열
    r'\/(?![*\/])(?:\\.|[^\/\\])*\/[gimuy]*|'                       # 정규식 (주석 혼동 방어)
    r'\/\*[\s\S]*?\*\/|'                                            # 블록 주석
    r'\/\/.*)',                                                     # 한 줄 주석
    re.MULTILINE
)

m1 = pattern.match(test_str1)
m2 = pattern.match(test_str2)

print("Match 1:", m1.group(0) if m1 else "Failed")
print("Match 2:", m2.group(0) if m2 else "Failed")

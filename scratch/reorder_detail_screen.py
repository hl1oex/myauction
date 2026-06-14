# DetailScreen.tsx 파일의 탭 명칭을 갱신하고 입지분석과 입찰분석 렌더링 블록 순서를 교체하는 스크립트입니다.
import os

file_path = "d:/BackUp/OneDrive/AI공부/Real estate auction/mobile-app/src/screens/DetailScreen.tsx"
if not os.path.exists(file_path):
    print("[-] DetailScreen.tsx 파일을 찾을 수 없습니다.")
    exit(1)

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. 탭 라벨 갱신
# 보관지/시세 -> 보관지 & 입지
content = content.replace("{ key: 'location', label: '3. 보관지/시세' }", "{ key: 'location', label: '3. 보관지 & 입지' }")
# 금융분석 -> 입찰 & 금융
content = content.replace("{ key: 'bidding', label: '4. 금융분석' }", "{ key: 'bidding', label: '4. 입찰 & 금융' }")
# 위치 & 시세 -> 입지 & 위치
content = content.replace("{ key: 'location', label: '3. 위치 & 시세' }", "{ key: 'location', label: '3. 입지 & 위치' }")
# 입찰분석 -> 입찰 & 금융
content = content.replace("{ key: 'bidding', label: '4. 입찰분석' }", "{ key: 'bidding', label: '4. 입찰 & 금융' }")

# 2. 블록 순서 교체
lines = content.splitlines(keepends=True)

# 각 블록의 시작 인덱스 찾기
start_bidding = -1
start_location = -1

for idx, line in enumerate(lines):
    if "activeTab === 'bidding' &&" in line:
        start_bidding = idx
    if "activeTab === 'location' &&" in line:
        start_location = idx

if start_bidding == -1 or start_location == -1:
    print("[-] bidding 또는 location 블록 시작 지점을 찾을 수 없습니다.")
    exit(1)

print(f"[+] bidding 시작 줄: {start_bidding + 1}, location 시작 줄: {start_location + 1}")

def find_block_end(start_idx):
    bracket_count = 0
    paren_count = 0
    first_line = lines[start_idx]
    bracket_count += first_line.count('{') - first_line.count('}')
    paren_count += first_line.count('(') - first_line.count(')')
    
    for idx in range(start_idx + 1, len(lines)):
        line = lines[idx]
        bracket_count += line.count('{') - line.count('}')
        paren_count += line.count('(') - line.count(')')
        if bracket_count <= 0:
            return idx
    return -1

end_bidding = find_block_end(start_bidding)
end_location = find_block_end(start_location)

if end_bidding == -1 or end_location == -1:
    print("[-] 블록 끝 지점을 찾을 수 없습니다.")
    exit(1)

print(f"[+] bidding 끝 줄: {end_bidding + 1}, location 끝 줄: {end_location + 1}")

# bidding 블록 추출 (주석부터 포함시키기 위해 start_bidding 직전의 빈 줄이나 주석 줄이 있는지 탐색)
def adjust_start_with_comments(start_idx):
    idx = start_idx
    while idx > 0:
        prev_line = lines[idx - 1].strip()
        if prev_line.startswith("{/*") and "탭 */}" in prev_line:
            idx -= 1
            break
        elif prev_line == "":
            idx -= 1
        else:
            break
    return idx

adj_start_bidding = adjust_start_with_comments(start_bidding)
adj_start_location = adjust_start_with_comments(start_location)

print(f"[+] 조정된 bidding 시작 줄: {adj_start_bidding + 1}, location 시작 줄: {adj_start_location + 1}")

bidding_block = lines[adj_start_bidding : end_bidding + 1]
location_block = lines[adj_start_location : end_location + 1]

# bidding 블록과 location 블록이 연속되어 있거나 그 사이에 여백이 있는지 확인
# 현재 순서: bidding 블록이 위에 있고 location 블록이 아래에 있음
if not (adj_start_bidding < end_bidding < adj_start_location < end_location):
    print("[-] 예상된 블록 배치 순서가 아닙니다.")
    exit(1)

# 재배치된 라인 생성
new_lines = (
    lines[:adj_start_bidding] + 
    location_block + 
    lines[end_bidding + 1 : adj_start_location] + 
    bidding_block + 
    lines[end_location + 1 :]
)

# 파일에 저장
with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("[+] DetailScreen.tsx 리팩토링 및 탭 순서 교체가 성공적으로 완료되었습니다.")

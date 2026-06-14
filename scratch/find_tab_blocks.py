# DetailScreen.tsx의 activeTab 분기 블록들의 시작과 끝 라인 번호를 정밀 분석하는 도구입니다.
import os

tsx_path = "d:/BackUp/OneDrive/AI공부/Real estate auction/mobile-app/src/screens/DetailScreen.tsx"

if not os.path.exists(tsx_path):
    print("[-] DetailScreen.tsx 파일을 찾을 수 없습니다.")
    exit(1)

with open(tsx_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"[+] 총 라인 수: {len(lines)}")

# 각 activeTab 조건문이 있는 줄을 파악하고, 그 이후 괄호 중괄호 매칭을 통해 끝나는 지점을 찾습니다.
tab_blocks = ['general', 'rights', 'bidding', 'location', 'etc_specs']
block_starts = {}

for idx, line in enumerate(lines):
    for tb in tab_blocks:
        if f"activeTab === '{tb}' &&" in line:
            block_starts[tb] = idx

# 괄호 매칭 알고리즘을 이용해 각 블록의 정확한 범위를 구합니다.
for tb, start_idx in sorted(block_starts.items(), key=lambda x: x[1]):
    # {activeTab === 'xxx' && (  구조이므로
    # 이 줄부터 시작해서 중괄호 {}와 소괄호 () 매칭을 검사합니다.
    bracket_count = 0
    paren_count = 0
    end_idx = -1
    
    # 첫 줄의 '{' 와 '(' 개수를 반영합니다.
    first_line = lines[start_idx]
    bracket_count += first_line.count('{') - first_line.count('}')
    paren_count += first_line.count('(') - first_line.count(')')
    
    for i in range(start_idx + 1, len(lines)):
        line = lines[i]
        bracket_count += line.count('{') - line.count('}')
        paren_count += line.count('(') - line.count(')')
        
        # bracket_count와 paren_count가 최초로 0 이하가 되는 시점을 찾습니다.
        # {activeTab === 'xxx' && ( ... )} 형식이므로 bracket_count가 0이 되면 블록 종료로 볼 수 있습니다.
        if bracket_count <= 0:
            end_idx = i
            break
            
    print(f"Block: {tb}")
    print(f"  Start: Line {start_idx + 1}")
    print(f"  End: Line {end_idx + 1}")
    print(f"  Preview Start: {lines[start_idx].strip()}")
    if end_idx != -1:
        print(f"  Preview End: {lines[end_idx].strip()}")

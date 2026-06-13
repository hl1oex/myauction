# -*- coding: utf-8 -*-
import io

def get_hangeul():
    h = {}
    h["ga_to_hih"] = chr(44032) + "-" + chr(55203) # 가-힣
    h["si"] = chr(49884) # 시
    h["do"] = chr(46020) # 도
    h["gu"] = chr(44396) # 구
    h["gun"] = chr(44400) # 군
    h["dong"] = chr(46041) # 동
    h["eup"] = chr(51021) # 읍
    h["myeon"] = chr(47732) # 면
    h["ri"] = chr(47532) # 리
    h["letter_o"] = chr(12641) # ㅇ
    h["gang_o_o"] = chr(44053) + chr(12641) + chr(12641) # 강ㅇㅇ
    h["mie_sang"] = chr(48120) + chr(49345) # 미상
    
    h["soyoo"] = chr(49548) + chr(50976) + chr(51088) # 소유자
    h["imdae"] = chr(51076) + chr(45824) + chr(51064) # 임대인
    h["chaemu"] = chr(45208) + chr(47924) + chr(51088) # 채무자
    h["chaekwon"] = chr(52292) + chr(44428) + chr(51088) # 채권자
    h["pyosi"] = chr(54364) + chr(49884) # 표시
    h["myeongse"] = chr(47749) + chr(49464) # 명세
    h["gibon"] = chr(44592) + chr(48376) # 기본
    h["budongsan"] = chr(48512) + chr(46041) + chr(49328) # 부동산
    h["clipboard_emoji"] = chr(128203) # 📋 이모지
    
    return h

def fix_index_html():
    h = get_hangeul()
    file_path = "index.html"
    try:
        with io.open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # 1. maskName 함수 구현부를 정교하게 교체하여 데이터 누락시 "강ㅇㅇ"을 반환하도록 수정
        lines = content.split('\n')
        in_mask_function = False
        start_idx = -1
        end_idx = -1
        
        for idx, line in enumerate(lines):
            if 'const maskName = (name) => {' in line or 'const maskName = name => {' in line:
                in_mask_function = True
                start_idx = idx
            if in_mask_function and line.strip() == '};':
                end_idx = idx
                break
                
        if start_idx != -1 and end_idx != -1:
            new_func = [
                '            const maskName = (name) => {',
                '                if (!name || name === "' + h["mie_sang"] + '" || name === "-" || name.trim() === "") return "' + h["gang_o_o"] + '";',
                '                const clean = name.trim();',
                '                if (clean.length <= 1) return clean;',
                '                return clean[0] + "' + h["letter_o"] + '".repeat(Math.max(1, clean.length - 1));',
                '            };'
            ]
            lines = lines[:start_idx] + new_func + lines[end_idx+1:]
            print("[index.html] maskName function updated with 'Gang O O' default fallback")
        
        content = '\n'.join(lines)
        
        # 주소 매칭 정규식도 재확인
        regex_str = '            const addressMatch = cleanedTitleAddress.match(/^([' + h["ga_to_hih"] + 'a-zA-Z0-9\\\\s-]+(?:' + h["si"] + '|' + h["do"] + ')\\\\s+[' + h["ga_to_hih"] + 'a-zA-Z0-9\\\\s-]+(?:' + h["gu"] + '|' + h["gun"] + '|' + h["si"] + ')\\\\s+[' + h["ga_to_hih"] + 'a-zA-Z0-9\\\\s-]+(?:' + h["dong"] + '|' + h["eup"] + '|' + h["myeon"] + '|' + h["ri"] + ')?\\\\s+\\\\d+(?:-\\\\d+)?)/);'
        
        lines = content.split('\n')
        for idx, line in enumerate(lines):
            if 'const addressMatch = cleanedTitleAddress.match' in line:
                lines[idx] = regex_str
                print("[index.html] addressMatch regex applied")
                
        content = '\n'.join(lines)

        with io.open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("[index.html] write complete")
        
    except Exception as e:
        print("[ERROR] index.html fix failed:", e)

def fix_mobile_detail():
    h = get_hangeul()
    file_path = "mobile-app/src/screens/DetailScreen.tsx"
    try:
        # 먼저 Checkout 상태로 안전 복구 수행
        import subprocess
        subprocess.run(["git", "checkout", "--", file_path], check=True)
        
        with io.open(file_path, "r", encoding="utf-8", errors="surrogateescape") as f:
            content = f.read()

        # 1. 소유자/채무자 가상 정보 카드에 대한 단순 치환
        # 김* 이 포함된 라인과 주식이 포함된 라인을 정확히 찾아서 앞뒤로 묶음
        lines = content.split('\n')
        start_idx = -1
        end_idx = -1
        
        for idx, line in enumerate(lines):
            if '김*' in line and 'infoValue' in line:
                # 2줄 위에 View가 있는 경우
                start_idx = idx - 4
            if start_idx != -1 and '주식' in line and 'infoValue' in line:
                # 채무자 정보 아래에 닫는 태그 </View> </View>까지 (대략 10줄 이내)
                for sub_idx in range(idx, idx+15):
                    if '</View>' in lines[sub_idx] and lines[sub_idx+1].strip() == '</View>':
                        end_idx = sub_idx + 2
                        break
                break
                
        if start_idx != -1 and end_idx != -1:
            new_block = [
                '            {/* 가상 소유자 및 채무자 정보 */}',
                '            <View style={styles.sectionCard}>',
                '              <Text style={styles.sectionTitle}>' + h["clipboard_emoji"] + ' ' + h["budongsan"] + ' ' + h["pyosi"] + ' ' + chr(48143) + ' ' + h["gibon"] + ' ' + h["myeongse"] + ' (' + h["soyoo"] + '/' + h["chaemu"] + ')</Text>',
                '              <View style={styles.infoTable}>',
                '                <View style={styles.infoRow}>',
                '                  <Text style={styles.infoLabel}>' + h["soyoo"] + ' (' + h["imdae"] + ')</Text>',
                '                  <Text style={styles.infoValue}>',
                '                    {(() => {',
                '                      const name = currentProperty.owner;',
                '                      if (!name || name === "' + h["mie_sang"] + '" || name === "-" || name.trim() === "") return "' + h["gang_o_o"] + '";',
                '                      const clean = name.trim();',
                '                      if (clean.length <= 1) return clean;',
                '                      return clean[0] + "' + h["letter_o"] + '".repeat(Math.max(1, clean.length - 1));',
                '                    })()}',
                '                  </Text>',
                '                </View>',
                '                <View style={styles.infoRow}>',
                '                  <Text style={styles.infoLabel}>' + h["chaemu"] + '</Text>',
                '                  <Text style={styles.infoValue}>',
                '                    {(() => {',
                '                      const name = currentProperty.debtor;',
                '                      if (!name || name === "' + h["mie_sang"] + '" || name === "-" || name.trim() === "") return "' + h["gang_o_o"] + '";',
                '                      const clean = name.trim();',
                '                      if (clean.length <= 1) return clean;',
                '                      return clean[0] + "' + h["letter_o"] + '".repeat(Math.max(1, clean.length - 1));',
                '                    })()}',
                '                  </Text>',
                '                </View>',
                '                <View style={styles.infoRow}>',
                '                  <Text style={styles.infoLabel}>' + h["chaekwon"] + ' (' + chr(44221) + chr(47588) + chr(49888) + chr(52493) + chr(51064) + ')</Text>',
                '                  <Text style={styles.infoValue}>\uc544\uc8fc\uc800\ucd95\uc740\ud589 (\uacbd\ub77d \ub4f1\uae30\uc124\uc815)</Text>',
                '                </View>',
                '              </View>',
                '            </View>'
            ]
            lines = lines[:start_idx] + new_block + lines[end_idx:]
            print("[DetailScreen.tsx] Owner/Debtor UI block replaced successfully")
        else:
            print("[DetailScreen.tsx] ERROR: Owner/Debtor UI block not found by target mapping")
            
        content = '\n'.join(lines)
        
        # 2. 물건 구조/재질 렌더링을 위한 분석 블록을 '부동산 표시 및 기본 명세' 카드 내부에 추가
        # 'round_info' 아래에 '물건 구조/재질' 항목 주입
        lines = content.split('\n')
        target_idx = -1
        for idx, line in enumerate(lines):
            if 'round_info' in line and 'infoValue' in line:
                for sub_idx in range(idx, idx+5):
                    if '</View>' in lines[sub_idx]:
                        target_idx = sub_idx + 1
                        break
                break
                
        if target_idx != -1:
            structure_block = [
                '                <View style={styles.infoRow}>',
                '                  <Text style={styles.infoLabel}>\ubb3c\uac74 \uad6c\uc870/\uc7ac\uc9c8</Text>',
                '                  <Text style={styles.infoValue}>',
                '                    {(() => {',
                '                      let detectedStr = "\ucca0\uace8\ucca0\uadfc\uccca0\uadfc\ud06c\ub9ac\ud0b8";',
                '                      const kwList = ["\ucca0\uace8\ucca0\uadfc\uccca0\uadfc\ud06c\ub9ac\ud0b8", "\ucca0\uadfc\ud06c\ub9ac\ud0b8", "\ubcbd\ub3cc\uc870", "\uc87c\uc801\uc870", "\uc5eb\uc640\uc870", "\uc2dc\uba58\ud2b8\ubcbd\ub3cc", "\ube14\ub85d\uc870", "\ubaa9\uc870", "\uac15\ud30c\uc774\ud504", "\uacbd\ub7c9\ucca0\uace8", "\ucca0\uace8\uc870", "\uc81d\uc870"];',
                '                      const searchTxt = `${currentProperty.address || ""} ${currentProperty.desc_content || ""} ${currentProperty.notes_content || ""}`.toLowerCase();',
                '                      for (const kw of kwList) {',
                '                        if (searchTxt.includes(kw)) {',
                '                          detectedStr = kw;',
                '                          break;',
                '                        }',
                '                      }',
                '                      return detectedStr;',
                '                    })()}',
                '                  </Text>',
                '                </View>'
            ]
            lines = lines[:target_idx] + structure_block + lines[target_idx:]
            print("[DetailScreen.tsx] Structure infoRow inserted successfully")
        
        content = '\n'.join(lines)
        
        with io.open(file_path, "w", encoding="utf-8", errors="surrogateescape") as f:
            f.write(content)
        print("[DetailScreen.tsx] write complete")
        
    except Exception as e:
        print("[ERROR] DetailScreen.tsx fix failed:", e)

if __name__ == "__main__":
    fix_index_html()
    fix_mobile_detail()

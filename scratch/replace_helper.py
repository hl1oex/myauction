# -*- coding: utf-8 -*-
# index.html의 기능 개선 및 가독성 수정을 모두 수행하는 자동화 스크립트.
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. 전용면적 정규식 폴백 추가
regex_target = """            if (exclusiveArea <= 0) {
                const exclusiveRegexes = [
                    /(?:전용면적|건물전용|전용|건물)\s*(\d+(?:\.\d+)?)\s*㎡/,
                    /(\d+(?:\.\d+)?)\s*㎡\s*\((?:전용|건물)\)/
                ];
                for (const regex of exclusiveRegexes) {
                    const match = textToSearch.match(regex);
                    if (match && match[1]) {
                        exclusiveArea = parseFloat(match[1]);
                        hasRealExclusive = true; // 텍스트 상에서 정규식으로 실제 데이터 발굴 성공
                        break;
                    }
                }
            }"""

regex_replacement = """            if (exclusiveArea <= 0) {
                const exclusiveRegexes = [
                    /(?:전용면적|건물전용|전용|건물)\s*(\d+(?:\.\d+)?)\s*㎡/,
                    /(\d+(?:\.\d+)?)\s*㎡\s*\((?:전용|건물)\)/
                ];
                for (const regex of exclusiveRegexes) {
                    const match = textToSearch.match(regex);
                    if (match && match[1]) {
                        exclusiveArea = parseFloat(match[1]);
                        hasRealExclusive = true; // 텍스트 상에서 정규식으로 실제 데이터 발굴 성공
                        break;
                    }
                }
                // [보완] 주소 본문 및 비고란에 키워드가 없더라도 단독 '59.95㎡' 형식으로 기재된 면적이 있을 때 후순위 추출
                if (!hasRealExclusive) {
                    const allMatches = [...textToSearch.matchAll(/(\d+(?:\.\d+)?)\s*㎡/g)];
                    if (allMatches.length > 0) {
                        // 주소 및 내용 상의 여러 면적(예: 층별 면적 등) 중 가장 마지막 수치가 개별 호실의 전용면적일 확률이 가장 높음
                        const lastMatch = allMatches[allMatches.length - 1];
                        exclusiveArea = parseFloat(lastMatch[1]);
                        hasRealExclusive = true;
                    }
                }
            }"""

# 2. 데이터 서버 로드 시 가공 적용
server_load_target = """                    if (allData.length > 0) {
                        originalProperties = allData.map(item => {
                            let finalId = item.id;
                            if (!isNaN(Number(finalId))) {
                                finalId = Number(finalId);
                            }
                            const remDays = calculateRemainingDays(item.bidding_date);
                            return { ...item, id: finalId, remaining_days: remDays };
                        });"""

server_load_replacement = """                    if (allData.length > 0) {
                        originalProperties = allData.map(item => {
                            let finalId = item.id;
                            if (!isNaN(Number(finalId))) {
                                finalId = Number(finalId);
                            }
                            const remDays = calculateRemainingDays(item.bidding_date);
                            let enriched = { ...item, id: finalId, remaining_days: remDays };
                            return enrichPropertyData(enriched);
                        });"""

# 3. 캐시 데이터 로드 시 가공 적용
cache_load_target = """                    const parsed = JSON.parse(cachedData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        originalProperties = parsed;"""

cache_load_replacement = """                    const parsed = JSON.parse(cachedData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        originalProperties = parsed.map(item => enrichPropertyData(item));"""

# 4. 폴백 및 로컬 오프라인 데이터 로드 시 가공 적용
fallback_load_target = """        function loadFallbackData() {
            const sensor = document.getElementById("connection-sensor");
            originalProperties = fallbackData;
            
            // 로컬스토리지 캐시 데이터 복구 시도
            try {
                const cached = localStorage.getItem('cached_properties');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        originalProperties = parsed;"""

fallback_load_replacement = """        function loadFallbackData() {
            const sensor = document.getElementById("connection-sensor");
            originalProperties = fallbackData.map(item => enrichPropertyData(item));
            
            // 로컬스토리지 캐시 데이터 복구 시도
            try {
                const cached = localStorage.getItem('cached_properties');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        originalProperties = parsed.map(item => enrichPropertyData(item));"""

# CRLF line endings 대응 치환 헬퍼
def replace_safe(text, target, repl):
    text_lf = text.replace("\r\n", "\n")
    target_lf = target.replace("\r\n", "\n")
    repl_lf = repl.replace("\r\n", "\n")
    
    if target_lf in text_lf:
        # 파일 원본이 CRLF인지 LF인지 식별하여 치환
        if "\r\n" in text:
            return text.replace(target_lf.replace("\n", "\r\n"), repl_lf.replace("\n", "\r\n"))
        else:
            return text.replace(target_lf, repl_lf)
    return text

# 순차 치환 진행
content = replace_safe(content, regex_target, regex_replacement)
content = replace_safe(content, server_load_target, server_load_replacement)
content = replace_safe(content, cache_load_target, cache_load_replacement)
content = replace_safe(content, fallback_load_target, fallback_load_replacement)

# 5. 부동산 표시 및 기본 명세 테이블 가독성 향상 치환 (pattern_alt 정규식 활용)
# group 1: 시작 태그 (<div class="space-y-2.5 ...">)
# group 2: 중간 마크업
# group 3: detail-spec-minimum
# group 4: 닫기 태그들 전까지의 나머지
# group 5: 닫기 태그 (</div>\s*</div>)
# 테이블 전체 마크업 영역을 잡아서 치환합니다.
pattern_alt = r'(<div class="space-y-2\.5 text-\[11px\] sm:text-xs font-bold text-slate-700">)(.*?)(detail-spec-minimum)(.*?)(</div>\s*</div>)'

replacement_table = """
                    <div class="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex justify-between items-center">
                        <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">소재지 주소</span>
                        <span id="detail-doc-address" class="font-semibold text-slate-800 select-all text-right max-w-[70%] truncate text-[11px] sm:text-[13px] font-sans"></span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-slate-750">
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">부동산 용도</span>
                            <span id="detail-spec-ptype" class="font-semibold text-slate-800 text-[11px] sm:text-[13px] font-sans"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">진행 회차</span>
                            <span id="detail-spec-round" class="font-semibold text-slate-800 text-[11px] sm:text-[13px] font-sans"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">소유자</span>
                            <span id="detail-owner" class="font-semibold text-slate-800 text-[11px] sm:text-[13px] font-sans"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">채무자</span>
                            <span id="detail-debtor" class="font-semibold text-slate-800 text-[11px] sm:text-[13px] font-sans"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">전용 면적</span>
                            <span id="detail-spec-exclusive-py" class="font-bold text-royalBlue font-mono text-[11px] sm:text-[13px]"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">공급 면적</span>
                            <span id="detail-spec-supply-py" class="font-bold text-royalBlue font-mono text-[11px] sm:text-[13px]"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">토지 대지권</span>
                            <span id="detail-spec-land-py" class="font-bold text-royalBlue font-mono text-[11px] sm:text-[13px]"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">건물 전용</span>
                            <span id="detail-spec-building-py" class="font-bold text-royalBlue font-mono text-[11px] sm:text-[13px]"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">감정평가액</span>
                            <span id="detail-spec-appraisal" class="font-bold text-slate-900 font-mono text-[11px] sm:text-[13px]"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">최저입찰액</span>
                            <span id="detail-spec-minimum" class="font-black text-rose-600 font-mono text-[11px] sm:text-[13px]"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex justify-between items-center col-span-2">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">물건 구조/재질</span>
                            <span id="detail-spec-structure" class="font-semibold text-slate-800 text-right text-[11px] sm:text-[13px] font-sans"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex justify-between items-center col-span-2">
                            <span class="text-slate-500 font-medium text-[11px] sm:text-[13px] font-sans">입찰일/마감 여부</span>
                            <span id="detail-spec-date" class="font-semibold text-slate-800 text-right text-[11px] sm:text-[13px] font-sans"></span>
                        </div>
                    </div>
"""

# re.DOTALL을 사용해 줄바꿈 포함 매치하여 치환 적용
match = re.search(pattern_alt, content, re.DOTALL)
if match:
    # pattern_alt 전체 매칭을 replacement_table로 덮어씌움
    content = re.sub(pattern_alt, r'\1' + replacement_table, content, flags=re.DOTALL)
    print("Success replacing table markup!")
else:
    print("Regex match for table markup failed!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("All replacements completed successfully!")

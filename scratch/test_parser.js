// 연식 파싱 알고리즘 테스트 스크립트입니다.
// index.html에 작성된 extractNonBuildingMeta 함수를 동일하게 가져와 다양한 유형의 차량 제목과 본문에 대해 검사합니다.

function extractNonBuildingMeta(text, ptype, title) {
    const meta = {};
    if (!text) return meta;
    const p_clean = (ptype || "").toLowerCase();
    const text_clean = text.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
    
    const isVehicle = p_clean.includes("차량") || p_clean.includes("자동차") || p_clean.includes("중기") || p_clean.includes("선박") || p_clean.includes("항공기") || p_clean.includes("운송") || p_clean.includes("지게차") || p_clean.includes("장비");
    
    let yearVal = null;
    if (title) {
        const title_clean = title.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
        
        // 1. 4자리 연도 매칭
        const year4StrictMatch = title_clean.match(/(19\d{2}|20\d{2})\s*(?:년식|년형|년|제작)/i);
        if (year4StrictMatch) {
            yearVal = year4StrictMatch[1] + "년식";
        }
        
        // 2. 2자리 연도 매칭 및 세기 자동 보정
        if (!yearVal) {
            const year2Match = title_clean.match(/(\d{2})\s*(?:년식|년형|년)/i);
            if (year2Match) {
                let yearNum = parseInt(year2Match[1]);
                if (yearNum >= 80 && yearNum <= 99) {
                    yearVal = (1900 + yearNum) + "년식";
                } else {
                    yearVal = (2000 + yearNum) + "년식";
                }
            }
        }
        
        // 3. 괄호 안의 연도 감지
        if (!yearVal) {
            const parenMatch = title_clean.match(/\((20\d{2}|19\d{2}|\d{2})\s*(?:년식|년형|년)?\)/i);
            if (parenMatch) {
                let val = parenMatch[1];
                if (val.length === 2) {
                    let yearNum = parseInt(val);
                    if (yearNum >= 80 && yearNum <= 99) {
                        yearVal = (1900 + yearNum) + "년식";
                    } else {
                        yearVal = (2000 + yearNum) + "년식";
                    }
                } else {
                    yearVal = val + "년식";
                }
            }
        }

        // 4. 일반 4자리 연도 단독 매칭
        if (!yearVal) {
            const simpleYearMatch = title_clean.match(/\b(19\d{2}|20\d{2})\b/);
            if (simpleYearMatch) {
                const idx = simpleYearMatch.index;
                const beforeStr = title_clean.substring(Math.max(0, idx - 10), idx);
                const afterStr = title_clean.substring(idx + 4, Math.min(title_clean.length, idx + 15));
                if (!beforeStr.includes("타경") && !afterStr.includes("타경") && !beforeStr.includes("관리번호") && !afterStr.includes("-") && !beforeStr.includes("/")) {
                    yearVal = simpleYearMatch[1] + "년식";
                }
            }
        }
    }

    const keywordsMap = {
        base_location: ['사용본거지', '사용 본거지', '본거지'],
        vehicle_no: ['등록번호', '차량등록번호', '차량번호', '등록 번호'],
        model_name: ['차명', '모델명', '차 명', '모델 명'],
        model_year: ['연식', '연 식', '제작년도', '제작연도', '제작 년도', '제작 연도', '연 식:'],
        vehicle_type: ['차종', '차 종'],
        vin: ['차대번호', '차대 번호'],
        engine_type: ['원동기형식', '원동기 형식', '원동기'],
        storage_location: ['보관장소', '보관 장소', '보관지', '소재지', '보관'],
        spec_no: ['제원관리번호', '제원 관리번호', '관리번호', '제원번호'],
        fuel: ['연료', '연 료'],
        displacement: ['배기량', '배기 량'],
        color: ['색상', '색 상']
    };

    const matches = [];
    for (const [key, aliases] of Object.entries(keywordsMap)) {
        for (const alias of aliases) {
            const regexStr = alias.replace(/\s+/g, "\\s*") + "\\s*:\\s*";
            const regex = new RegExp(regexStr, "gi");
            let match;
            while ((match = regex.exec(text_clean)) !== null) {
                matches.push({ key: key, alias: alias, start: match.index, end: regex.lastIndex });
            }
        }
    }

    matches.sort((a, b) => a.start - b.start);
    const filteredMatches = [];
    let lastEnd = -1;
    for (const m of matches) {
        if (m.start >= lastEnd) {
            filteredMatches.push(m);
            lastEnd = m.end;
        }
    }

    const parsed = {};
    for (let i = 0; i < filteredMatches.length; i++) {
        const current = filteredMatches[i];
        const next = filteredMatches[i + 1];
        const valueStart = current.end;
        const valueEnd = next ? next.start : text_clean.length;
        let value = text_clean.substring(valueStart, valueEnd).trim();
        value = value.replace(/^[,\s:|#;]+|[,\s:|#;]+$/g, "").trim();
        parsed[current.key] = value;
    }

    if (isVehicle) {
        meta.asset_type = "vehicle";
        meta.model_year = yearVal || (parsed.model_year ? (parsed.model_year.includes("년") ? parsed.model_year : parsed.model_year + "년식") : null);
        meta.vehicle_no = parsed.vehicle_no || null;
        meta.model_name = parsed.model_name || null;
    }
    return meta;
}

const testCases = [
    { title: "2018년식 쏘렌토 디젤 2.2", desc: "사용본거지: 서울 등록번호: 12가3456", expectedYear: "2018년식" },
    { title: "현대 아반떼 (19년식) 가솔린", desc: "사용본거지: 대전 등록번호: 98무7654", expectedYear: "2019년식" },
    { title: "기아 카니발 (2015) 9인승", desc: "사용본거지: 대구 등록번호: 54오4321", expectedYear: "2015년식" },
    { title: "봉고3 트럭 18년형 초장축", desc: "사용본거지: 부산 등록번호: 32라2109", expectedYear: "2018년식" },
    { title: "제네시스 G80 2021", desc: "사용본거지: 인천 등록번호: 87차6543", expectedYear: "2021년식" },
    { title: "쌍용 체어맨 99년식 클래식", desc: "사용본거지: 광주 등록번호: 11가1111", expectedYear: "1999년식" }
];

console.log("=== 연식 파싱 알고리즘 유닛 테스트 시작 ===");
let passedCount = 0;
for (const tc of testCases) {
    const res = extractNonBuildingMeta(tc.desc, "차량", tc.title);
    const parsedYear = res.model_year;
    const isSuccess = parsedYear === tc.expectedYear;
    if (isSuccess) {
        passedCount++;
        console.log(`[PASS] 제목: "${tc.title}" -> 파싱 연식: "${parsedYear}"`);
    } else {
        console.log(`[FAIL] 제목: "${tc.title}" -> 예상: "${tc.expectedYear}", 실제: "${parsedYear}"`);
    }
}
console.log(`\n결과: ${passedCount} / ${testCases.length} 개 테스트 성공.`);
if (passedCount === testCases.length) {
    console.log("모든 테스트가 성공적으로 완수되었습니다.");
} else {
    process.exit(1);
}

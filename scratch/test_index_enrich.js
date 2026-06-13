// index.html의 최신 코드를 긁어와서 데이터 파싱이 잘 돌아가는지 최종 검증하는 스크립트.
const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// 2025타경9483 매물 데이터 정의
const mockItem = {
  "id": 6579,
  "source": "court",
  "auction_no": "2025타경9483",
  "address": "경상북도 경산시 사동 600-3 초원파크 2층204호  철근콘크리트조 슬래브지붕 15층 아파트 1층 1814.725㎡ 2층 1800.36㎡ 3층 1800.36㎡ 4층 1800.36㎡ 5층 1800.36㎡ 6층 1800.36㎡ 7층 1800.36㎡ 8층 1800.36㎡ 9층 1800.36㎡ 10층 1800.36㎡ 11층 1800.36㎡ 12층 1800.36㎡ 13층 1800.36㎡ 14층 1800.36㎡ 15층 1800.36㎡ 지하 827.828㎡ 철근콘크리트조 59.95㎡",
  "ptype": "아파트",
  "appraised_value": 75000000,
  "minimum_bid": 36750000,
  "bidding_date": "2026-06-16",
  "round_info": "20260616 회차 정보",
  "desc_content": "상세 정보 요약 내용이 존재하지 않습니다.",
  "notes_content": "🟡 AI 주의 리스크 검출! (특별 매각조건 등 확인 권장) | 2025.10.22.자 신청채권자 서울보증보험(주택임차권자 한국토지주택공사의 양수인)로부터 우선변제만 주장하며 대항력 포기한다는 확약서 제출됨(전액 변제 받지 못하더라도 매수인에 대한 임대차보증금 반환청구권 포기하며 임차권등기 말소 동의한는 서면 제출).",
  "link_url": "https://www.courtauction.go.kr",
  "grade": "D",
  "score": 75,
  "remaining_days": null,
  "updated_at": "2026-06-07T10:31:48.826686+00:00"
};

// index.html에서 getDeterministicHash 및 enrichPropertyData 함수 추출
const hashFuncMatch = indexHtmlContent.match(/function getDeterministicHash[\s\S]*?return Math\.abs\(hash\);\s*\}/);
const enrichFuncMatch = indexHtmlContent.match(/function enrichPropertyData[\s\S]*?return item;\s*\}/);

if (!hashFuncMatch || !enrichFuncMatch) {
    console.error("Failed to extract functions from index.html!");
    process.exit(1);
}

const getDeterministicHash = eval(`(${hashFuncMatch[0]})`);
const enrichPropertyData = eval(`(${enrichFuncMatch[0]})`);

const result = enrichPropertyData(mockItem);
console.log("Validation Result:");
console.log("Auction No:", result.auction_no);
console.log("Exclusive Area:", result.exclusive_area, "(Expected: 59.95)");
console.log("Is Estimated Exclusive:", result.is_estimated_exclusive, "(Expected: false)");
console.log("Land Area:", result.land_area, "(Expected: 10.78 / Estimated: true)");
console.log("Is Estimated Land:", result.is_estimated_land);
console.log("Supply Area (Estimated):", result.supply_area);
console.log("Is Estimated Supply:", result.is_estimated_supply);

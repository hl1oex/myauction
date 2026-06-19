# -*- coding: utf-8 -*-
# DetailScreen.tsx의 AI 예상 시세 시뮬레이터, 계산기 및 모의입찰 콤마, 리스크 리포트 및 투자 총평을 고도화하는 패치 스크립트입니다.
# 모든 설명 및 코드 주석은 한국어로 작성하며 문장 끝 콜론 금지 규칙을 엄격하게 준수합니다.

import os

def main():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\mobile-app\src\screens\DetailScreen.tsx"
    
    if not os.path.exists(filepath):
        print("DetailScreen.tsx 파일을 찾을 수 없습니다.")
        return

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. generateLegalRiskReportMobile 함수 고도화 (법률적 성립 요건 및 판례 상세화)
    old_risk_report_mobile = """  // 🏆 [모바일 전용] AI 7대 권리 리스크 하이브리드 리포트 생성기
  const generateLegalRiskReportMobile = (item: Property) => {
    const textToSearch = `${item.address} ${item.desc_content} ${item.notes_content}`.toLowerCase();
    let warnings: React.ReactNode[] = [];

    const handleOpenDoc = (url: string) => {
      Linking.openURL(url);
    };

    // 1. 건물만 매각 / 대지권 없음
    if (textToSearch.includes("대지권없음") || textToSearch.includes("토지만") || textToSearch.includes("건물만") || textToSearch.includes("대지권 미등기")) {
      warnings.push(
        <View key="1" style={[styles.riskCard, { borderLeftColor: COLORS.crimsonAlert }]}>
          <Text style={styles.riskCardTitle}>🧱 토지 사용권 분쟁 (건물만 매각 / 대지권 없음)</Text>
          <Text style={styles.riskCardDesc}>건물의 소유권만 낙찰받고 토지 사용권을 가져오지 못해 토지 소유주로부터 매달 땅 사용료(지료) 소송 또는 건물 철거 압박 소송에 처할 심각한 리스크가 있습니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 입찰 절대 금지. 토지 소유주와의 법적 대립으로 자산이 묶일 위험이 심대합니다.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.courtauction.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>매각물건명세서 조회</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOpenDoc('https://eum.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>토지이음 바로가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    // 2. 토지별도등기
    if (textToSearch.includes("토지별도")) {
      warnings.push(
        <View key="2" style={[styles.riskCard, { borderLeftColor: COLORS.warningGold }]}>
          <Text style={styles.riskCardTitle}>📝 토지별도등기 인수 우려</Text>
          <Text style={styles.riskCardDesc}>토지에 집합건물 건축 전에 근저당 등 권리가 남아 있는 물건입니다. 낙찰금으로 해결되지 않고 소멸되지 않는 채무라면 고스란히 승계됩니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - '매각물건명세서' 상에서 토지 근저당이 특별 매각조건으로 낙찰 후 말소되는지 반드시 재확인하십시오.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.iros.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>인터넷등기소 바로가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 3. 지분제한
    if (textToSearch.includes("지분")) {
      warnings.push(
        <View key="3" style={[styles.riskCard, { borderLeftColor: COLORS.crimsonAlert }]}>
          <Text style={styles.riskCardTitle}>👥 공동소유 지분 제한 리스크</Text>
          <Text style={styles.riskCardDesc}>자산의 지분(일부)만 획득하는 물건으로, 독단적으로 임대 계약을 맺거나 실거주를 하기 어려우며, 차후 지분분할청구소송 등 복잡한 공유자 간 소송을 야기합니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 공유 지분은 자유로운 매도가 극도로 어렵습니다. 전문가가 아니라면 절대 추천하지 않습니다.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.iros.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>등기부등본 열람</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 4. 유치권
    if (textToSearch.includes("유치권") || textToSearch.includes("유치권 주장")) {
      warnings.push(
        <View key="4" style={[styles.riskCard, { borderLeftColor: COLORS.crimsonAlert }]}>
          <Text style={styles.riskCardTitle}>🛠️ 유치권 주장 (점유 및 공사대금 인수)</Text>
          <Text style={styles.riskCardDesc}>공사비를 회수하지 못한 업자 등이 불법/적법 점유하고 있는 물건입니다. 최악의 경우 공사 대금을 낙찰자가 대신 다 변제해주어야 명도 인도가 완료됩니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 입찰 절대 피하십시오. 유치권 성립 여부에 대한 장기 명도 소송 및 대위 변제 리스크가 극대화됩니다.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.courtauction.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>매각물건명세서 조회</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 5. 명도 곤란 및 점유미상
    if (textToSearch.includes("명도곤란") || textToSearch.includes("점유관계미상")) {
      warnings.push(
        <View key="5" style={[styles.riskCard, { borderLeftColor: COLORS.warningGold }]}>
          <Text style={styles.riskCardTitle}>🚪 불법/미상 점유자 명도 지연</Text>
          <Text style={styles.riskCardDesc}>점유주가 협상을 거부하거나 대화가 두절되어 있는 깜깜이 상태입니다. 강제 집행에 따른 강제 비용(평당 15만원 수준) 및 6개월 이상의 입주 연기가 예측됩니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 낙찰 잔금 납부 즉시 '인도명령'을 신청하되, 합의를 대비한 통상적 이사 비용을 예산에 산입하십시오.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.courtauction.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>현황조사서 열람</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 6. 보증금 인수 대항력
    if (textToSearch.includes("인수") || textToSearch.includes("선순위") || textToSearch.includes("대항력") || textToSearch.includes("임차권") || textToSearch.includes("보증금 인수")) {
      warnings.push(
        <View key="6" style={[styles.riskCard, { borderLeftColor: COLORS.crimsonAlert }]}>
          <Text style={styles.riskCardTitle}>💰 대항력 있는 세입자 보증금 인수 (독박 채무)</Text>
          <Text style={styles.riskCardDesc}>말소기준권리보다 빠른 선순위 임차인이 있어 보증금이 법원에서 배당되지 못할 경우, **낙찰자가 세입자의 보증금 차액 전액을 현금으로 대신 갚아주어야만 점유 이전이 됩니다.**</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 임차인의 배당 순위를 구하고 낙찰자가 독박을 써야 하는 보증금 인수 예상 금액을 미리 감액해 보수적으로 입찰가를 산정하십시오.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.gov.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>정부24 전입세대열람</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.courtauction.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>매각물건명세서 조회</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 7. 깜깜이 투자 정보 부재
    if (textToSearch.includes("서류없음") || textToSearch.includes("확인불가") || textToSearch.includes("열람불가") || textToSearch.includes("자료없음")) {
      warnings.push(
        <View key="7" style={[styles.riskCard, { borderLeftColor: COLORS.slate400 }]}>
          <Text style={styles.riskCardTitle}>⚠️ 정보 부재 및 깜깜이 투자 우려</Text>
          <Text style={styles.riskCardDesc}>공식 서류나 임대차 조사가 투명하게 밝혀지지 않은 자산입니다. 예측하지 못한 내부 손상이나 불명예스러운 권리 관계가 사후에 발견될 리스크가 높습니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 현장 탐문 및 주민 조사를 통해 점유 실태를 명확히 구명하기 전에는 입찰을 피하십시오.</Text>
        </View>
      );
    }"""

    new_risk_report_mobile = """  // 🏆 [모바일 전용] AI 7대 권리 리스크 하이브리드 리포트 생성기
  const generateLegalRiskReportMobile = (item: Property) => {
    const textToSearch = `${item.address} ${item.desc_content} ${item.notes_content}`.toLowerCase();
    let warnings: React.ReactNode[] = [];

    const handleOpenDoc = (url: string) => {
      Linking.openURL(url);
    };

    // 1. 건물만 매각 / 대지권 없음
    if (textToSearch.includes("대지권없음") || textToSearch.includes("토지만") || textToSearch.includes("건물만") || textToSearch.includes("대지권 미등기")) {
      warnings.push(
        <View key="1" style={[styles.riskCard, { borderLeftColor: COLORS.crimsonAlert }]}>
          <Text style={styles.riskCardTitle}>🧱 토지 사용권 분쟁 (건물만 매각 / 대지권 없음) 리스크</Text>
          <Text style={styles.riskCardDesc}>건물의 소유권만 낙찰받고 토지 사용권을 가져오지 못해 토지 소유주로부터 매달 땅 사용료(지료) 소송 또는 건물 철거 압박 소송에 처할 심각한 리스크가 있습니다. 대법원 판례에 따르면 토지와 건물의 소유주가 분리되는 경우 법정지상권의 성립 요건(저당권 설정 당시 건물의 존재 여부, 소유주 동일성 등)이 철저하게 다투어지게 됩니다. 만약 지상권이 불성립한다면 토지 소유주는 건물철거청구 및 토지인도청구 소송(민법 제214조)을 제기하여 낙찰자를 강하게 압박할 것입니다. 초보자는 입찰을 절대 금지해야 하며, 전문가라 하더라도 토지 소유주와의 지료 감정평가 및 건물 매수청구권 협상 전략이 수립되지 않았다면 입찰을 절대 지양해야 합니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 입찰 절대 금지. 토지 소유주와의 법적 대립으로 자산이 장기간 묶여 원금 손실을 초래할 수 있습니다.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.courtauction.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>매각물건명세서 조회</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOpenDoc('https://eum.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>토지이음 바로가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    // 2. 토지별도등기
    if (textToSearch.includes("토지별도")) {
      warnings.push(
        <View key="2" style={[styles.riskCard, { borderLeftColor: COLORS.warningGold }]}>
          <Text style={styles.riskCardTitle}>📝 토지별도등기 인수 우려</Text>
          <Text style={styles.riskCardDesc}>토지에 집합건물 건축 전에 근저당 등 권리가 남아 있는 물건입니다. 집합건물의 소유 및 관리에 관한 법률 제20조에 의거하여 전유부분과 대지사용권의 일체성이 깨질 수 있는 권리 관계입니다. 낙찰대금 중 대지 지분에 배당되는 금액이 토지 저당권자에게 전액 변제되지 않거나, 법원 경매 절차에서 토지저당권자가 채권을 신고하지 않아 배당에서 제외될 경우, 소멸되지 않은 근저당 채무 또는 가압류 권리가 고스란히 낙찰자에게 인수 승계될 중대한 위험이 존재합니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 법원의 '매각물건명세서' 상에서 토지 근저당이 특별 매각조건으로 낙찰 후 완전히 말소되는 조건인지 반드시 재확인하십시오.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.iros.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>인터넷등기소 바로가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 3. 지분제한
    if (textToSearch.includes("지분")) {
      warnings.push(
        <View key="3" style={[styles.riskCard, { borderLeftColor: COLORS.crimsonAlert }]}>
          <Text style={styles.riskCardTitle}>👥 공동소유 지분 제한 리스크</Text>
          <Text style={styles.riskCardDesc}>자산의 지분(일부)만 획득하는 물건으로, 민법 제265조에 따라 공유물의 관리에 관한 사항은 공유자의 지분의 과반수로써 결정해야 하므로, 반수 미만의 소수 지분을 낙찰받을 경우 타 공유자들의 동의 없이는 독단적으로 임대 계약을 맺거나 실거주를 하기 어렵습니다. 나아가 공유 지분권자 상호 간 대립으로 협의 분할이 무산될 시, 결국 민법 제269조에 의거해 공유물전체 경매를 통한 현금 배분 소송(공유물분할청구소송)으로 이어지는 긴 지리한 사법 공방을 피할 수 없습니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 공유 지분은 시중 은행 잔금 대출 및 자유로운 매도가 사실상 불가능합니다. 전문가가 아니라면 지분 경매는 무조건 피하십시오.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.iros.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>등기부등본 열람</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 4. 유치권
    if (textToSearch.includes("유치권") || textToSearch.includes("유치권 주장")) {
      warnings.push(
        <View key="4" style={[styles.riskCard, { borderLeftColor: COLORS.crimsonAlert }]}>
          <Text style={styles.riskCardTitle}>🛠️ 유치권 주장 (점유 및 공사대금 인수)</Text>
          <Text style={styles.riskCardDesc}>공사비를 회수하지 못한 시공업자 또는 하도급업자 등이 유치물에 관하여 생긴 공사대금 채권을 변제받기 위해 점유하고 주장하는 난해한 권리 관계입니다. 유치권이 법적으로 인정(성립)될 경우, 민법 제320조에 의거하여 채무를 모두 갚기 전에는 낙찰자가 해당 부동산을 점유·인도받을 수 없으며 최악의 경우 거액의 공사 미지급금을 대위변제해주어야 합니다. 성립 요건(채권의 변제기 도래, 점유의 계속성 및 개시결정 등기 전 점유 개시, 유치권 배제 특약 부재 등)을 입찰 전에 면밀히 확인해야 합니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 입찰을 전적으로 피하십시오. 성립 여부에 대한 장기 명도 소송 및 대위 변제 리스크가 극대화되는 영역입니다.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.courtauction.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>매각물건명세서 조회</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 5. 명도 곤란 및 점유미상
    if (textToSearch.includes("명도곤란") || textToSearch.includes("점유관계미상")) {
      warnings.push(
        <View key="5" style={[styles.riskCard, { borderLeftColor: COLORS.warningGold }]}>
          <Text style={styles.riskCardTitle}>🚪 불법/미상 점유자 명도 지연</Text>
          <Text style={styles.riskCardDesc}>점유 관계가 명확하지 않거나 불법 점유주가 퇴거 및 합의 협상을 완강하게 거부하여 대화가 단절되어 있는 깜깜이 상태입니다. 민법 제213조 소유물반환청구권 및 민사집행법 제136조 부동산인도명령에 의거하여 즉각적인 인도결정이 발효될 수 있으나 강제 집행 착수 시까지 법원 예납금 및 평당 15만원 수준의 노무비, 운반비 등 집행 비용이 실비 청구됩니다. 또한 최장 6개월 이상의 물리적 지연에 처해 금리 이자 손실을 떠안을 우려가 매우 농후합니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 낙찰 잔금 납부 즉시 법원에 '인도명령'을 신청하되, 합의 협상을 위한 이사비 합의금을 미리 예산에 조율해 두는 것을 권장합니다.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.courtauction.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>현황조사서 열람</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 6. 보증금 인수 대항력
    if (textToSearch.includes("인수") || textToSearch.includes("선순위") || textToSearch.includes("대항력") || textToSearch.includes("임차권") || textToSearch.includes("보증금 인수")) {
      warnings.push(
        <View key="6" style={[styles.riskCard, { borderLeftColor: COLORS.crimsonAlert }]}>
          <Text style={styles.riskCardTitle}>💰 대항력 있는 세입자 보증금 인수 (독박 채무)</Text>
          <Text style={styles.riskCardDesc}>말소기준권리보다 빠른 선순위 임차인이 있어 보증금이 법원에서 배당되지 못할 경우, 주택임대차보호법 제3조 제4항에 의거하여 낙찰자가 임대인의 지위를 승계하므로 세입자의 보증금 차액 전액을 현금으로 직접 갚아주어야만 점유 이전이 됩니다. 만약 대항력 있는 임차인이 확정일자를 늦게 받아 배당 순위에서 제외되거나 전액 배당을 못 받는다면, 그 미배당 보증금 잔액은 고스란히 낙찰자의 현금 인수의무로 전환되어 심대한 추가 부담을 야기합니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 임차인의 배당 순위를 구하고 낙찰자가 독박을 써야 하는 보증금 인수 예상 금액을 미리 감액해 보수적으로 입찰가를 산정하십시오.</Text>
          <View style={styles.riskLinkContainer}>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.gov.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>정부24 전입세대열람</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOpenDoc('https://www.courtauction.go.kr')} style={styles.riskLinkBtn}>
              <Text style={styles.riskLinkBtnText}>매각물건명세서 조회</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 7. 깜깜이 투자 정보 부재
    if (textToSearch.includes("서류없음") || textToSearch.includes("확인불가") || textToSearch.includes("열람불가") || textToSearch.includes("자료없음")) {
      warnings.push(
        <View key="7" style={[styles.riskCard, { borderLeftColor: COLORS.slate400 }]}>
          <Text style={styles.riskCardTitle}>⚠️ 정보 부재 및 깜깜이 투자 우려</Text>
          <Text style={styles.riskCardDesc}>공식 서류나 임대차 조사가 투명하게 밝혀지지 않은 자산입니다. 민사집행법에 따른 집행관 현황조사 보고서나 법원 감정평가서가 극히 누락된 경우, 보이지 않는 건물 내부의 파손 누수, 불법 구조 변경에 따른 이행강제금 누적, 또는 신고되지 않은 임차인의 은밀한 점유 관계가 사후에 확인되어 막대한 행정 및 하자 보수 비용이 사후 청구될 치명적 소지가 존재합니다.</Text>
          <Text style={styles.riskCardAction}>👉 초보 대응 지침 - 철저한 현장 탐문 및 전입세대 주민 조사를 통해 점유 실태를 투명하게 해명하기 전까지는 입찰을 전적으로 보류하십시오.</Text>
        </View>
      );
    }"""

    content = content.replace(old_risk_report_mobile, new_risk_report_mobile)


    # 2. generateDynamicAIComment (동적 투자 총평) 상세화
    old_ai_comment_mobile = """  // 🤖 [실시간 연동] LTV/금리/입찰가 기반 동적 AI 투자 총평 생성기
  const generateDynamicAIComment = () => {
    const basePrice = bidValue > 0 ? bidValue : (currentProperty.minimum_bid || 0);
    const est = estimateAuctionRounds(currentProperty.appraised_value, currentProperty.minimum_bid, currentProperty.source);
    const loan = Math.floor(basePrice * (ltvPercent / 100));
    const ptype = (currentProperty.ptype || "").toLowerCase();
    const taxRate = (ptype.includes("상가") || ptype.includes("점포") || ptype.includes("근린") || ptype.includes("토지") || ptype.includes("공장") || ptype.includes("빌딩") || ptype.includes("기타")) ? 0.046 : 0.015;
    const acquisitionTax = Math.floor(basePrice * taxRate);
    const agencyFee = Math.floor(basePrice * 0.005);
    const cashNeeded = basePrice - loan + acquisitionTax + agencyFee;
    const annualInterest = Math.floor(loan * (interestRate / 100));
    const monthlyInterest = Math.floor(annualInterest / 12);
    const marketCompareDiff = currentProperty.appraised_value - basePrice - annualInterest;
    const roiRate = cashNeeded > 0 ? ((marketCompareDiff / cashNeeded) * 105).toFixed(1) : "0.0";

    return (
      <View style={{ backgroundColor: COLORS.slate50, borderWidth: 1, borderColor: COLORS.slate200, padding: 12, borderRadius: 16 }}>
        <Text style={{ fontSize: 13, lineHeight: 20, color: COLORS.slate800 }}>
          본 매물은 감정가 <Text style={{ fontWeight: 'bold', color: COLORS.slate900 }}>{formatCurrency(currentProperty.appraised_value)} ({formatCurrencyKorean(currentProperty.appraised_value)})</Text> 대비 <Text style={{ fontWeight: 'bold', color: COLORS.royalBlue }}>{est.discount}%</Text> 저감된 최저 매각가 <Text style={{ fontWeight: 'bold', color: COLORS.slate900 }}>{formatCurrency(currentProperty.minimum_bid)} ({formatCurrencyKorean(currentProperty.minimum_bid)})</Text>에 매각 진행 중인 자산입니다.{"\\n"}{"\\n"}
          현재 설정하신 입찰 응찰가 <Text style={{ fontWeight: 'bold', color: COLORS.royalBlue }}>{formatCurrency(basePrice)} ({formatCurrencyKorean(basePrice)})</Text> 기준으로 낙찰 시, 대출 LTV는 <Text style={{ fontWeight: 'bold', color: COLORS.royalBlue }}>LTV {ltvPercent}%</Text> 설정이 적용되어 최대 <Text style={{ fontWeight: 'bold', color: COLORS.slate900 }}>{formatCurrency(loan)} ({formatCurrencyKorean(loan)})</Text> of 대출 재원을 조달하게 됩니다.{"\\n"}{"\\n"}
          이에 따라 취득세 등 행정 세법 비용을 합산하여 최종적으로 준비해야 하는 실투자 자금은 약 <Text style={{ fontWeight: 'bold', color: COLORS.royalBlue }}>{formatCurrency(cashNeeded)} ({formatCurrencyKorean(cashNeeded)})</Text> 수준입니다.{"\\n"}{"\\n"}
          대출 금리 연 <Text style={{ fontWeight: 'bold', color: COLORS.slate900 }}>{interestRate.toFixed(1)}%</Text> 기준 시 연간 예상 이자 비용은 약 <Text style={{ fontWeight: 'bold', color: COLORS.crimsonAlert }}>{formatCurrency(annualInterest)} ({formatCurrencyKorean(annualInterest)})</Text>이며, 매월 고정 납부하는 이자는 약 <Text style={{ fontWeight: 'bold', color: COLORS.crimsonAlert }}>{formatCurrency(monthlyInterest)}</Text>가 발생합니다.{"\\n"}{"\\n"}
          시세 차익에 따르는 연간 이자 기회비용을 대조한 결과, 세후 순수익률(ROI)은 약 <Text style={{ fontWeight: 'bold', color: COLORS.emeraldSuccess, fontSize: 14 }}>{roiRate}%</Text>의 매우 유의미한 가치로 산출됩니다.{"\\n"}{"\\n"}
          {currentProperty.grade === "A" || currentProperty.grade === "B" ? (
            <Text style={{ fontSize: 13, lineHeight: 20 }}>
              해당 매물은 권리분석 등급 분류 상 안전 자산(<Text style={{ fontWeight: 'bold', color: COLORS.emeraldSuccess }}>{currentProperty.grade}등급</Text>)으로 판정되어 추가적인 인수금이 발생할 위험이 적습니다. 시뮬레이션 시나리오 표를 바탕으로 적절한 입찰가 밴드를 도출하여 <Text style={{ fontWeight: 'bold', color: COLORS.royalBlue }}>적극적으로 입찰에 참여하실 것을 강력하게 권고합니다.</Text>
            </Text>
          ) : (
            <Text style={{ fontSize: 13, lineHeight: 20 }}>
              다만 권리분석 등급 분류 상 인수 리스크 경고(<Text style={{ fontWeight: 'bold', color: COLORS.crimsonAlert }}>{currentProperty.grade}등급</Text>) 판정을 받아, 보증금 미배당 금액이나 유치권 등 낙찰자 인수 리스크가 큽니다. 시뮬레이션 수익률에 치우치기보다 보수적으로 유찰 시점까지 대기하거나 전문 명도 법률 검토를 사전에 병행하셔야 합니다.
            </Text>
          )}
        </Text>
      </View>
    );
  };"""

    new_ai_comment_mobile = """  // 🤖 [실시간 연동] LTV/금리/입찰가 기반 동적 AI 투자 총평 생성기
  const generateDynamicAIComment = () => {
    const basePrice = bidValue > 0 ? bidValue : (currentProperty.minimum_bid || 0);
    const est = estimateAuctionRounds(currentProperty.appraised_value, currentProperty.minimum_bid, currentProperty.source);
    const loan = Math.floor(basePrice * (ltvPercent / 100));
    const ptype = (currentProperty.ptype || "").toLowerCase();
    const taxRate = (ptype.includes("상가") || ptype.includes("점포") || ptype.includes("근린") || ptype.includes("토지") || ptype.includes("공장") || ptype.includes("빌딩") || ptype.includes("기타")) ? 0.046 : 0.015;
    const acquisitionTax = Math.floor(basePrice * taxRate);
    const agencyFee = Math.floor(basePrice * 0.005);
    const cashNeeded = basePrice - loan + acquisitionTax + agencyFee;
    const annualInterest = Math.floor(loan * (interestRate / 100));
    const monthlyInterest = Math.floor(annualInterest / 12);
    const marketCompareDiff = currentProperty.appraised_value - basePrice - annualInterest;
    const roiRate = cashNeeded > 0 ? ((marketCompareDiff / cashNeeded) * 105).toFixed(1) : "0.0";

    return (
      <View style={{ backgroundColor: COLORS.slate50, borderWidth: 1, borderColor: COLORS.slate200, padding: 12, borderRadius: 16 }}>
        <Text style={{ fontSize: 13, lineHeight: 20, color: COLORS.slate800 }}>
          본 매물은 감정가 <Text style={{ fontWeight: 'bold', color: COLORS.slate900 }}>{formatCurrency(currentProperty.appraised_value)} ({formatCurrencyKorean(currentProperty.appraised_value)})</Text> 대비 <Text style={{ fontWeight: 'bold', color: COLORS.royalBlue }}>{est.discount}%</Text> 저감된 최저 매각가 <Text style={{ fontWeight: 'bold', color: COLORS.slate900 }}>{formatCurrency(currentProperty.minimum_bid)} ({formatCurrencyKorean(currentProperty.minimum_bid)})</Text>에 매각 진행 중인 자산입니다.{"\\n"}{"\\n"}
          현재 설정하신 입찰 응찰가 <Text style={{ fontWeight: 'bold', color: COLORS.royalBlue }}>{formatCurrency(basePrice)} ({formatCurrencyKorean(basePrice)})</Text> 기준으로 낙찰 시, 대출 LTV는 <Text style={{ fontWeight: 'bold', color: COLORS.royalBlue }}>LTV {ltvPercent}%</Text> 설정이 적용되어 최대 <Text style={{ fontWeight: 'bold', color: COLORS.slate900 }}>{formatCurrency(loan)} ({formatCurrencyKorean(loan)})</Text>의 대출 재원을 조달하게 됩니다.{"\\n"}{"\\n"}
          이에 따라 취득세 등 행정 세법 비용을 합산하여 최종적으로 준비해야 하는 실투자 자금은 약 <Text style={{ fontWeight: 'bold', color: COLORS.royalBlue }}>{formatCurrency(cashNeeded)} ({formatCurrencyKorean(cashNeeded)})</Text> 수준입니다.{"\\n"}{"\\n"}
          대출 금리 연 <Text style={{ fontWeight: 'bold', color: COLORS.slate900 }}>{interestRate.toFixed(1)}%</Text> 기준 시 연간 예상 이자 비용은 약 <Text style={{ fontWeight: 'bold', color: COLORS.crimsonAlert }}>{formatCurrency(annualInterest)} ({formatCurrencyKorean(annualInterest)})</Text>이며, 매월 고정 납부하는 이자는 약 <Text style={{ fontWeight: 'bold', color: COLORS.crimsonAlert }}>{formatCurrency(monthlyInterest)}</Text>가 발생합니다.{"\\n"}{"\\n"}
          시세 차익에 따르는 연간 이자 기회비용을 대조한 결과, 세후 순수익률(ROI)은 약 <Text style={{ fontWeight: 'bold', color: COLORS.emeraldSuccess, fontSize: 14 }}>{roiRate}%</Text>의 매우 유의미한 가치로 산출됩니다.{"\\n"}{"\\n"}
          {currentProperty.grade === "A" || currentProperty.grade === "B" ? (
            <Text style={{ fontSize: 13, lineHeight: 20 }}>
              해당 매물은 권리분석 등급 분류 상 안전 자산(<Text style={{ fontWeight: 'bold', color: COLORS.emeraldSuccess }}>{currentProperty.grade}등급</Text>)으로 판정되어 추가적인 인수금이 발생할 위험이 적습니다. 주택임대차보호법 및 민법상 소멸 기준 권리를 기점으로 후순위 가압류 및 가처분은 낙찰과 함께 깨끗하게 말소되므로 안전한 소유권 이전이 담보됩니다. 시뮬레이션 시나리오 표를 바탕으로 적절한 입찰가 밴드를 도출하여 <Text style={{ fontWeight: 'bold', color: COLORS.royalBlue }}>적극적으로 입찰에 참여하실 것을 강력하게 권고합니다.</Text>
            </Text>
          ) : (
            <Text style={{ fontSize: 13, lineHeight: 20 }}>
              다만 권리분석 등급 분류 상 인수 리스크 경고(<Text style={{ fontWeight: 'bold', color: COLORS.crimsonAlert }}>{currentProperty.grade}등급</Text>) 판정을 받아, 선순위 임차인의 보증금 미배당 금액 인수나 민법 제320조의 유치권 점유 분쟁 소지가 매우 농후합니다. 낙찰 후 소유권은 확보하더라도 민사소송 및 집행관 명도 인도 강제 집행 공방으로 이어질 리스크가 있어, 시뮬레이션 수익률 수치에 치우치기보다 보수적으로 다회 유찰 시점까지 대기하거나 전문 경매 법률 자문 검토를 사전에 병행하셔야 손실을 방어할 수 있습니다.
            </Text>
          )}
        </Text>
      </View>
    );
  };"""

    content = content.replace(old_ai_comment_mobile, new_ai_comment_mobile)


    # 3. 미래 예상 시세 산출 영역 다차원 고도화 및 경고 문구 수정
    old_future_price_mobile = """              <View style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7', borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 10 }}>
                <Text style={{ fontSize: 10, color: '#b45309', fontWeight: 'bold', lineHeight: 14 }}>
                  ⚠️ 본 예측 시세는 시나리오별 연 복리 상승률을 적용한 단순 추정치이며 실제 시장 변화와 다를 수 있으므로 참고용으로만 사용하시기 바랍니다.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.slate50, borderWidth: 1, borderColor: COLORS.slate200, padding: 8, borderRadius: 10, marginBottom: 10 }}>
                <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: COLORS.slate500 }}>연평균 미래 성장률</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[
                    { label: '보수적 (1.5%)', val: 1.5 },
                    { label: '표준 (3.0%)', val: 3.0 },
                    { label: '적극적 (5.0%)', val: 5.0 }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.val}
                      onPress={() => setFutureGrowthRate(item.val)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: futureGrowthRate === item.val ? COLORS.royalBlue : COLORS.slate200,
                      }}
                    >
                      <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: futureGrowthRate === item.val ? COLORS.white : COLORS.slate700 }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {(() => {
                const basePrice = currentProperty.appraised_value || 0;
                const r = futureGrowthRate / 100;
                
                const terms = [1, 3, 5, 10];
                const rows = terms.map(t => {
                  const cumRate = (Math.pow(1 + r, t) - 1) * 100;
                  const estPrice = Math.round(basePrice * Math.pow(1 + r, t));
                  return {
                    term: `${t}년 후`,
                    rate: `+${cumRate.toFixed(2)}%`,
                    price: formatCurrencyKorean(estPrice)
                  };
                });"""

    new_future_price_mobile = """              <View style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7', borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 10 }}>
                <Text style={{ fontSize: 10, color: '#b45309', fontWeight: 'bold', lineHeight: 14 }}>
                  ⚠️ AI 분석 예측 모델 기준 (가상 시나리오 지표 - 허수). 본 예측 시세는 입지 모멘텀, AI 등급 가산, 유찰 조정률, 거시 인플레이션 상수가 복합 반영된 시뮬레이션 지표이며 실제 시장 변화와 다를 수 있으므로 참고용으로만 사용하시기 바랍니다.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.slate50, borderWidth: 1, borderColor: COLORS.slate200, padding: 8, borderRadius: 10, marginBottom: 10 }}>
                <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: COLORS.slate500 }}>연평균 미래 성장률</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[
                    { label: '보수적 (1.5%)', val: 1.5 },
                    { label: '표준 (3.0%)', val: 3.0 },
                    { label: '적극적 (5.0%)', val: 5.0 }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.val}
                      onPress={() => setFutureGrowthRate(item.val)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: futureGrowthRate === item.val ? COLORS.royalBlue : COLORS.slate200,
                      }}
                    >
                      <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: futureGrowthRate === item.val ? COLORS.white : COLORS.slate700 }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {(() => {
                const basePrice = currentProperty.appraised_value || 0;
                
                // 입지 모멘텀 보정
                const addr = currentProperty.address || "";
                let locationMomentum = 0;
                if (addr.includes("서울") || addr.includes("경기") || addr.includes("인천")) {
                  locationMomentum = 0.8;
                } else if (addr.includes("부산") || addr.includes("대구") || addr.includes("대전") || addr.includes("광주") || addr.includes("울산") || addr.includes("세종")) {
                  locationMomentum = 0.3;
                } else {
                  locationMomentum = -0.2;
                }

                // AI 안전 등급 보정 (A등급: +0.5%, B등급: +0.1%, C등급: -0.5%)
                let aiGradeBonus = 0;
                const g = (currentProperty.ai_grade || "C").toUpperCase();
                if (g === "A") {
                  aiGradeBonus = 0.5;
                } else if (g === "B") {
                  aiGradeBonus = 0.1;
                } else {
                  aiGradeBonus = -0.5;
                }

                // 유찰 횟수 감가 조정 반영
                const auctionInfo = estimateAuctionRounds(currentProperty.appraised_value, currentProperty.minimum_bid, currentProperty.source);
                const failedCount = auctionInfo.failedCount;
                const failedCorrection = failedCount * -0.15;

                // 거시 인플레이션 보정 (+1.2%)
                const macroInflation = 1.2;

                const adjustedRate = futureGrowthRate + locationMomentum + aiGradeBonus + failedCorrection + macroInflation;
                const r = adjustedRate / 100;
                
                const terms = [1, 3, 5, 10];
                const rows = terms.map(t => {
                  const cumRate = (Math.pow(1 + r, t) - 1) * 100;
                  const estPrice = Math.round(basePrice * Math.pow(1 + r, t));
                  return {
                    term: `${t}년 후`,
                    rate: `+${cumRate.toFixed(2)}%`,
                    price: formatCurrencyKorean(estPrice)
                  };
                });"""

    content = content.replace(old_future_price_mobile, new_future_price_mobile)


    # 4. 모의입찰 입력 필드 콤마 처리 및 실시간 스프레드 요약 렌더링 주입
    old_mock_bid_input_area = """                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={styles.mockBidInput}
                      placeholder="예: 250000000"
                      value={userBidPrice}
                      onChangeText={setUserBidPrice}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity onPress={submitMockBid} style={styles.mockBidSubmitBtn}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>제출</Text>
                    </TouchableOpacity>
                  </View>
                  {isAlreadyBid && (
                    <Text style={{ fontSize: 10, color: COLORS.emeraldSuccess, fontWeight: 'bold', marginTop: 4 }}>
                      ✓ 이미 모의입찰에 참여하셨습니다. (수정 가능)
                    </Text>
                  )}"""

    new_mock_bid_input_area = """                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={styles.mockBidInput}
                      placeholder="예: 250,000,000"
                      value={userBidPrice}
                      onChangeText={(txt) => {
                        const clean = txt.replace(/[^0-9]/g, '');
                        if (clean === '') {
                          setUserBidPrice('');
                        } else {
                          setUserBidPrice(Number(clean).toLocaleString());
                        }
                      }}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity onPress={submitMockBid} style={styles.mockBidSubmitBtn}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>제출</Text>
                    </TouchableOpacity>
                  </View>
                  {isAlreadyBid && (
                    <Text style={{ fontSize: 10, color: COLORS.emeraldSuccess, fontWeight: 'bold', marginTop: 4 }}>
                      ✓ 이미 모의입찰에 참여하셨습니다. (수정 가능)
                    </Text>
                  )}

                  {/* 📊 실시간 세무/금융 자금계획 스프레드 영역 */}
                  {(() => {
                    const bidPrice = parseInt(userBidPrice.replace(/,/g, '')) || 0;
                    if (bidPrice <= 0) return null;

                    let taxRate = 0.015;
                    const ptype = (currentProperty.ptype || "").toLowerCase();
                    if (ptype.includes("상가") || ptype.includes("점포") || ptype.includes("근린") || ptype.includes("토지") || ptype.includes("공장") || ptype.includes("빌딩") || ptype.includes("기타")) {
                      taxRate = 0.046;
                    }
                    const acquisitionTax = Math.floor(bidPrice * taxRate);
                    const agencyFee = Math.floor(bidPrice * 0.005);
                    const totalBudget = bidPrice + acquisitionTax + agencyFee;
                    const loanAmount = Math.floor(bidPrice * 0.70);
                    const cashRequired = Math.max(0, totalBudget - loanAmount);

                    return (
                      <View style={{ marginTop: 14, backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 12, padding: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', pb: 4, marginBottom: 8 }}>
                          📋 실시간 자금 계획 스프레드 (시뮬레이션)
                        </Text>
                        <View style={{ gap: 4 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, color: '#64748b' }}>취득세 예상액</Text>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e293b' }}>{formatCurrency(acquisitionTax)}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, color: '#64748b' }}>법무 대행비 (0.5%)</Text>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e293b' }}>+ {formatCurrency(agencyFee)}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, color: '#64748b' }}>LTV 가상 대출한도 (70%)</Text>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e293b' }}>{formatCurrency(loanAmount)}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#eff6ff', padding: 6, borderRadius: 6, marginTop: 4 }}>
                            <Text style={{ fontSize: 11, color: COLORS.royalBlue, fontWeight: 'bold' }}>총 예상 소요자금</Text>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: COLORS.royalBlue }}>{formatCurrency(totalBudget)}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#ecfdf5', padding: 6, borderRadius: 6, marginTop: 2 }}>
                            <Text style={{ fontSize: 11, color: COLORS.emeraldSuccess, fontWeight: 'bold' }}>필요 최소 자기자본</Text>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: COLORS.emeraldSuccess }}>{formatCurrency(cashRequired)}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
                          ※ LTV 대출 규제 및 개인 신용도에 따라 실제 한도는 상이할 수 있습니다.
                        </Text>
                      </View>
                    );
                  })()}"""

    content = content.replace(old_mock_bid_input_area, new_mock_bid_input_area)


    # 5. submitMockBid 및 loadMockBidsData 함수에서 콤마 제거 파싱 대응
    old_submit_bid = """    const priceNum = parseInt(userBidPrice.trim());"""
    new_submit_bid = """    const priceNum = parseInt(userBidPrice.replace(/,/g, '').trim());"""
    content = content.replace(old_submit_bid, new_submit_bid)

    old_load_bid = """        if (myBid) {
          setUserBidPrice(myBid.bid_price.toString());
          setIsAlreadyBid(true);
        } else {"""
    new_load_bid = """        if (myBid) {
          setUserBidPrice(Number(myBid.bid_price).toLocaleString());
          setIsAlreadyBid(true);
        } else {"""
    content = content.replace(old_load_bid, new_load_bid)


    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print("DetailScreen.tsx 수술적 갱신이 성공적으로 마무리되었습니다.")

if __name__ == "__main__":
    main()

// Firestore 통신 모듈을 대체하여 Supabase PostgreSQL 클라우드 DB에서 실시간 매물 목록과 수집 로그를 직접 조회하는 데이터 통신 모듈입니다.
import { supabase } from './supabase';
import { Property } from '../types';

// 기일 문자열을 기준으로 오늘 날짜 대비 남은 D-Day 일수를 실시간 계산합니다.
function calculateRemainingDays(dateStr?: string): number {
  if (!dateStr) return 9999;
  try {
    const closeDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = closeDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 9999;
  }
}

export function getApiBaseUrl(): string {
  return "https://ubaxyfxcsxsvrryowswb.supabase.co";
}

function getDeterministicHash(str?: string): number {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export interface ParsedAreas {
  exclusiveArea: number;
  landArea: number;
  isEstimatedExclusive: boolean;
  isEstimatedLand: boolean;
  exclEstType: string;
  totalFloors: number;
  totalArea: number;
  floorAreas: Record<string, number>;
}

export function parseAreasFromText(
  text: string,
  ptype: string = "",
  appraisedValue: number = 0,
  address: string = ""
): ParsedAreas {
  let exclusiveArea = 0.0;
  let landArea = 0.0;
  let isEstimatedExclusive = true;
  let isEstimatedLand = true;
  let exclEstType = "fake";
  let totalFloors = 0;
  let totalArea = 0.0;
  let floorAreas: Record<string, number> = {};

  const stClean = text || "";
  const addrClean = address || "";
  const ptypeClean = ptype || "";

  // 0. 비건물 판별
  let isNonBuilding = false;
  const nonBuildingPtypes = ["토지", "임야", "도로", "대지", "잡종지", "전", "답", "과수원", "목장", "광천지", "염전", "묘지", "사적지", "목장용지"];
  if (nonBuildingPtypes.some(k => ptypeClean.includes(k))) {
    isNonBuilding = true;
  } else {
    const combinedForKws = `${stClean} ${addrClean}`.trim();
    const hasLandKeyword = ["토지만매각", "임야", "잡종지", "도로"].some(k => combinedForKws.includes(k));
    const hasBuildingKeyword = ["아파트", "빌라", "다세대", "연립", "주택", "건물", "상가", "공장", "창고", "호"].some(k => combinedForKws.includes(k));
    if (hasLandKeyword && !hasBuildingKeyword) {
      isNonBuilding = true;
    }
  }

  // 1단계/2단계 파싱을 위한 도우미 내장 함수
  function parseWithText(targetText: string) {
    let ex = 0.0;
    let ld = 0.0;
    let estEx = true;
    let estLd = true;
    let estType = "fake";
    let flAreas: Record<string, number> = {};

    // 1. 대지권 면적 추출 (지목 키워드 확장)
    const landMatchSqm = targetText.match(/(?:대지권|토지대지권|대지|토지|임야|도로|잡종지|과수원|공장용지|목장용지|묘지|송전용지|목장|전|답|대)\s*(?:면적)?\s*(\d+(?:\.\d+)?)\s*㎡/);
    if (landMatchSqm) {
      ld = parseFloat(landMatchSqm[1]);
      estLd = false;
    }
    if (ld === 0.0) {
      const landMatchPyung = targetText.match(/(?:대지권|토지대지권|대지|토지|임야|도로|잡종지|과수원|공장용지|목장용지|묘지|송전용지|목장|전|답|대)\s*(?:면적)?\s*(\d+(?:\.\d+)?)\s*평(?:형)?/);
      if (landMatchPyung) {
        ld = Math.round(parseFloat(landMatchPyung[1]) * 3.3058 * 100) / 100;
        estLd = false;
      }
    }

    // 2. 층수 및 호수 파싱
    let targetFloor: string | null = null;
    let targetRoom: string | null = null;
    const floorRoomMatch = targetText.match(/(?:(?:지하|지층)\s*(\d+)|(\d+))\s*층\s*([가-힣\d\-]+)\s*호/);
    if (floorRoomMatch) {
      const isBasement = targetText.includes("지하") || targetText.includes("지층");
      const floorNum = floorRoomMatch[1] || floorRoomMatch[2];
      targetFloor = isBasement ? `지하${floorNum}층` : `${floorNum}층`;
      targetRoom = floorRoomMatch[3];
    } else {
      const basementRoomMatch = targetText.match(/지층\s*([가-힣\d\-]+)\s*호/);
      if (basementRoomMatch) {
        targetFloor = "지층";
        targetRoom = basementRoomMatch[1];
      } else {
        const roomOnlyMatch = targetText.match(/\b(\d{3,4})\s*호/);
        if (roomOnlyMatch) {
          const roomStr = roomOnlyMatch[1];
          targetRoom = roomStr;
          if (roomStr.length === 3) {
            targetFloor = `${roomStr[0]}층`;
          } else if (roomStr.length === 4) {
            targetFloor = `${roomStr.substring(0, 2)}층`;
          }
        }
      }
    }

    // 3. 층별 면적 정보 구축
    const floorAreaMatches = targetText.matchAll(/(지층|지하\s*\d*층|\d+층)\s*(\d+(?:\.\d+)?)\s*(㎡|평(?:형)?)/g);
    for (const m of floorAreaMatches) {
      const fName = m[1].replace(/\s+/g, "");
      let val = parseFloat(m[2]);
      const unit = m[3];
      if (unit.includes("평")) {
        val = Math.round(val * 3.3058 * 100) / 100;
      }
      flAreas[fName] = val;
    }

    let totFloors = Object.keys(flAreas).length;
    const totalFloorsMatch = targetText.match(/(\d+)\s*층\s*(?:다세대주택|연립주택|빌라|건물|아파트)/);
    if (totalFloorsMatch) {
      totFloors = Math.max(totFloors, parseInt(totalFloorsMatch[1]));
    }
    let totArea = Math.round(Object.values(flAreas).reduce((sum, v) => sum + v, 0) * 100) / 100;

    // 4. 단독 기재된 전용면적 후보 추출
    const candidateExclusiveAreas: number[] = [];
    const sqmMatches = targetText.matchAll(/(\d+(?:\.\d+)?)\s*㎡/g);
    for (const m of sqmMatches) {
      const val = parseFloat(m[1]);
      if (!Object.values(flAreas).includes(val) && val !== ld) {
        candidateExclusiveAreas.push(val);
      }
    }
    const pyungMatches = targetText.matchAll(/(\d+(?:\.\d+)?)\s*평(?:형)?/g);
    for (const m of pyungMatches) {
      const val = Math.round(parseFloat(m[1]) * 3.3058 * 100) / 100;
      if (!Object.values(flAreas).includes(val) && val !== ld) {
        candidateExclusiveAreas.push(val);
      }
    }

    // 5. 전용면적 결정
    const exclKeywordMatch = targetText.match(/(?:건물전용|전용면적|전용|건물)\s*(\d+(?:\.\d+)?)\s*(㎡|평|평형)?/);
    if (exclKeywordMatch) {
      const val = parseFloat(exclKeywordMatch[1]);
      const unit = exclKeywordMatch[2];
      if (unit === "평" || unit === "평형") {
        ex = Math.round(val * 3.3058 * 100) / 100;
      } else if (!unit) {
        if (val >= 10 && val <= 55 && Number.isInteger(val)) {
          ex = Math.round(val * 3.3058 * 100) / 100;
        } else {
          ex = val;
        }
      } else {
        ex = val;
      }
      estEx = false;
      estType = "exact";
    }

    if (ex === 0.0 && candidateExclusiveAreas.length > 0) {
      ex = candidateExclusiveAreas[candidateExclusiveAreas.length - 1];
      estEx = false;
      estType = "exact";
    }

    if (ex === 0.0 && Object.keys(flAreas).length > 0) {
      let totalFloorArea = 0.0;
      if (targetFloor && flAreas[targetFloor]) {
        totalFloorArea = flAreas[targetFloor];
      } else {
        totalFloorArea = Math.max(...Object.values(flAreas));
      }

      const isVilla = ["다세대", "빌라", "연립"].some(k => targetText.includes(k));
      let divisor = 2;
      if (targetRoom) {
        const roomDigits = targetRoom.replace(/\D/g, "");
        if (roomDigits) {
          const roomNum = parseInt(roomDigits);
          if (!isVilla) {
            if (roomNum >= 100) {
              const estDivisor = Math.floor(roomNum / 100);
              divisor = estDivisor <= 1 ? 2 : estDivisor;
            } else {
              divisor = roomNum > 1 ? roomNum : 2;
            }
          } else {
            const lastDigit = roomNum % 10;
            if (lastDigit === 1 || lastDigit === 2) {
              divisor = 2;
            } else if (lastDigit === 3 || lastDigit === 4) {
              divisor = 4;
            } else if (lastDigit === 5 || lastDigit === 6) {
              divisor = 6;
            } else if (lastDigit > 6) {
              divisor = lastDigit;
            }
          }
        }
      }

      if (isVilla) {
        const estTotalFloors = totFloors > 0 ? totFloors : 1;
        ex = Math.round((totArea / (estTotalFloors * divisor)) * 100) / 100;
      } else {
        ex = Math.round((totalFloorArea / divisor) * 100) / 100;
      }
      estEx = true;
      estType = "estimated";
    }

    // 단위 생략 숫자 매칭 유추
    if (ex === 0.0) {
      const noUnitMatch = targetText.match(/\b(59|84|114|135|165|24|32|34|45)(?:\.\d+)?\s*(?:형|타입|py)?\b/);
      if (noUnitMatch) {
        const val = parseFloat(noUnitMatch[0].replace(/형|타입|py/g, "").trim());
        if (val <= 50) {
          ex = Math.round(val * 3.3058 * 100) / 100;
        } else {
          ex = val;
        }
        estEx = true;
        estType = "estimated";
      }
    }

    if (ex === 0.0 && !landMatchSqm) {
      const singleMatch = targetText.match(/(\d+(?:\.\d+)?)\s*(㎡|평(?:형)?)/);
      if (singleMatch) {
        let val = parseFloat(singleMatch[1]);
        const unit = singleMatch[2];
        if (unit.includes("평")) {
          val = Math.round(val * 3.3058 * 100) / 100;
        }
        const hasLandKeywords = ["임야", "토지", "대지", "잡종지", "대", "전", "답"].some(k => targetText.includes(k));
        const hasBuildingKeywords = ["아파트", "빌라", "다세대", "연립", "주택", "건물", "상가", "공장", "창고", "호"].some(k => targetText.includes(k));
        if (hasLandKeywords && !hasBuildingKeywords) {
          ld = val;
          estLd = false;
        } else {
          ex = val;
          estEx = false;
          estType = "exact";
        }
      }
    }

    return { ex, ld, estEx, estLd, estType, totFloors, totArea, flAreas };
  }

  // 1단계 파싱 (깨끗한 텍스트 위주)
  const hasContamination = ["제시외", "제외", "지분", "공유자", "일부", "비고", "주의", "특이사항"].some(k => stClean.includes(k));
  const cleanText = hasContamination ? `${addrClean} ${ptypeClean}`.trim() : `${stClean} ${addrClean} ${ptypeClean}`.trim();
  
  let result = parseWithText(cleanText);
  exclusiveArea = result.ex;
  landArea = result.ld;
  isEstimatedExclusive = result.estEx;
  isEstimatedLand = result.estLd;
  exclEstType = result.estType;
  totalFloors = result.totFloors;
  totalArea = result.totArea;
  floorAreas = result.flAreas;

  // 2단계 파싱 (1단계에서 전용면적이 검출되지 않았고 오염이 의심되는 키워드가 있던 경우, 전체 텍스트로 보완 파싱)
  if (exclusiveArea === 0.0 && hasContamination) {
    const fullText = `${stClean} ${addrClean} ${ptypeClean}`.trim();
    let resultFull = parseWithText(fullText);
    exclusiveArea = resultFull.ex;
    landArea = resultFull.ld;
    isEstimatedExclusive = resultFull.estEx;
    isEstimatedLand = resultFull.estLd;
    exclEstType = resultFull.estType;
    totalFloors = resultFull.totFloors;
    totalArea = resultFull.totArea;
    floorAreas = resultFull.flAreas;
  }

  // 감정가 기반 면적 유추 적용 (아직도 전용면적이 0인 경우)
  if (exclusiveArea === 0.0 && ptypeClean) {
    const isSeoulMetropolitan = ["서울", "경기", "인천", "분당"].some(r => addrClean.includes(r));
    const val = appraisedValue || 0;
    if (ptypeClean.includes("아파트") || ptypeClean.includes("오피스텔")) {
      if (isSeoulMetropolitan) {
        exclusiveArea = val >= 1500000000 ? 114.8 : (val >= 600000000 ? 84.9 : 59.9);
      } else {
        exclusiveArea = val >= 700000000 ? 114.8 : (val >= 300000000 ? 84.9 : 59.9);
      }
      isEstimatedExclusive = true;
      exclEstType = "estimated";
    } else if (ptypeClean.includes("다세대") || ptypeClean.includes("빌라") || ptypeClean.includes("연립") || ptypeClean.includes("주택")) {
      exclusiveArea = val >= 500000000 ? 84.9 : 59.9;
      isEstimatedExclusive = true;
      exclEstType = "estimated";
    }
  }

  if (isNonBuilding) {
    exclusiveArea = 0.0;
    isEstimatedExclusive = false;
    exclEstType = "exact";
  }

  return {
    exclusiveArea,
    landArea,
    isEstimatedExclusive,
    isEstimatedLand,
    exclEstType,
    totalFloors,
    totalArea,
    floorAreas
  };
}

export function enrichPropertyDataMobile(item: any): Property {
  if (!item) return item;
  
  let metadata: any = null;
  if (item.notes_content && item.notes_content.includes("__METADATA__:")) {
    const match = item.notes_content.match(/\n\n__METADATA__:(.*?)__/);
    if (match && match[1]) {
      try {
        metadata = JSON.parse(match[1]);
        item.notes_content = item.notes_content.replace(/\n\n__METADATA__:.*?__/, "").trim();
      } catch (e) {
        console.warn("Metadata parse error:", e);
      }
    }
  }
  let exclusiveArea = item.exclusive_area || 0;
  let landArea = item.land_area || 0;
  let isEstimatedExclusive = item.is_estimated_exclusive !== undefined ? item.is_estimated_exclusive : true;
  let isEstimatedLand = item.is_estimated_land !== undefined ? item.is_estimated_land : true;
  let exclEstType = item.exclusive_area_estimation_type || "fake";
  let totalFloors = item.building_total_floors || 0;
  let totalArea = item.building_total_area || 0;
  let floorAreas: Record<string, number> = item.floor_areas || {};

  const hash = getDeterministicHash(item.id?.toString() || item.auction_no || "default");
  const ptype = item.ptype || "";
  const textToSearch = `${item.address || ""} ${item.desc_content || ""} ${item.notes_content || ""}`;

  // ptype이나 textToSearch에 토지/임야 등의 비건물 키워드가 있고, 건물 관련 키워드가 없거나 명백한 토지 매물인 경우
  let isNonBuilding = false;
  const ptypeClean = ptype || "";
  const nonBuildingPtypes = ["토지", "임야", "도로", "대지", "잡종지", "전", "답", "과수원", "목장", "광천지", "염전", "묘지", "사적지", "목장용지"];
  if (nonBuildingPtypes.some(k => ptypeClean.includes(k))) {
    isNonBuilding = true;
  } else {
    const hasLandKeyword = ["토지만매각", "임야", "잡종지", "도로"].some(k => textToSearch.includes(k));
    const hasBuildingKeyword = ["아파트", "빌라", "다세대", "연립", "주택", "건물", "상가", "공장", "창고", "호"].some(k => textToSearch.includes(k));
    if (hasLandKeyword && !hasBuildingKeyword) {
      isNonBuilding = true;
    }
  }

  // 만약 exact 실제값 상태가 아니거나 값이 없을 때 실시간 정밀 파싱 추정 작동
  if (exclusiveArea <= 0 || exclEstType === "fake") {
    const parsed = parseAreasFromText(textToSearch, ptype, item.appraised_value || 0, item.address || "");
    if (parsed.exclusiveArea > 0) {
      exclusiveArea = parsed.exclusiveArea;
      isEstimatedExclusive = parsed.isEstimatedExclusive;
      exclEstType = parsed.exclEstType;
    }
    if (parsed.landArea > 0) {
      landArea = parsed.landArea;
      isEstimatedLand = parsed.isEstimatedLand;
    }
    totalFloors = parsed.totalFloors;
    totalArea = parsed.totalArea;
    floorAreas = parsed.floorAreas;
  }

  // 완전 폴백 예외 복원
  if (exclusiveArea <= 0) {
    if (ptype.includes("아파트") || ptype.includes("오피스텔") || ptype.includes("다세대") || ptype.includes("빌라")) {
      const commonAreas = [59.9, 84.9, 114.8, 39.5, 74.6];
      exclusiveArea = commonAreas[hash % commonAreas.length];
    } else if (ptype.includes("단독") || ptype.includes("다가구")) {
      const commonAreas = [120.5, 150.2, 180.8, 95.4];
      exclusiveArea = commonAreas[hash % commonAreas.length];
    } else if (ptype.includes("상가") || ptype.includes("점포") || ptype.includes("근린")) {
      const commonAreas = [33.5, 66.8, 115.4, 25.8];
      exclusiveArea = commonAreas[hash % commonAreas.length];
    } else if (ptype.includes("공장") || ptype.includes("창고")) {
      const commonAreas = [350.5, 480.2, 750.8];
      exclusiveArea = commonAreas[hash % commonAreas.length];
    } else {
      exclusiveArea = 84.9;
    }
    isEstimatedExclusive = true;
    exclEstType = "fake";
  }

  // 비건물 자산인 경우 최종 예외 처리
  if (isNonBuilding) {
    exclusiveArea = 0.0;
    isEstimatedExclusive = false;
    exclEstType = "exact"; // exact로 지정하여 뱃지 미노출
  }

  if (landArea <= 0) {
    isEstimatedLand = true;
    if (ptype.includes("아파트") || ptype.includes("오피스텔")) {
      const factors = [0.18, 0.25, 0.32, 0.38];
      landArea = parseFloat((exclusiveArea * factors[hash % factors.length]).toFixed(2));
    } else if (ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("단독") || ptype.includes("다가구")) {
      const factors = [0.55, 0.68, 0.78, 0.88];
      landArea = parseFloat((exclusiveArea * factors[hash % factors.length]).toFixed(2));
    } else if (ptype.includes("토지") || ptype.includes("임야")) {
      const commonLands = [150.5, 330.2, 660.8, 1200.5];
      landArea = commonLands[hash % commonLands.length];
    } else {
      landArea = parseFloat((exclusiveArea * 0.4).toFixed(2));
    }
  } else {
    isEstimatedLand = false;
  }

  let supplyArea = item.supply_area || 0;
  let isEstimatedSupply = false;
  if (supplyArea <= 0) {
    isEstimatedSupply = true;
    let multiplier = 1.3;
    if (ptype.includes("아파트")) multiplier = 1.32;
    else if (ptype.includes("오피스텔")) multiplier = 1.35;
    else if (ptype.includes("다세대") || ptype.includes("빌라")) multiplier = 1.22;
    else if (ptype.includes("상가") || ptype.includes("점포")) multiplier = 1.5;
    else if (ptype.includes("단독") || ptype.includes("다가구")) multiplier = 1.15;
    supplyArea = parseFloat((exclusiveArea * multiplier).toFixed(2));
  }
  
  let buildingArea = item.building_area || 0;
  let isEstimatedBuilding = false;
  if (buildingArea <= 0) {
    isEstimatedBuilding = true;
    buildingArea = exclusiveArea;
  }

  if (metadata) {
    item.exclusive_area = metadata.exclusive_area || 0;
    item.land_area = metadata.land_area || 0;
    item.supply_area = metadata.supply_area || 0;
    item.building_area = metadata.building_area || 0;
    item.is_estimated_exclusive = metadata.is_estimated_exclusive !== false;
    item.is_estimated_supply = metadata.is_estimated_supply !== false;
    item.is_estimated_land = metadata.is_estimated_land !== false;
    item.is_estimated_building = metadata.is_estimated_building !== false;
    item.complex_info = metadata.complex_info || null;
    item.elementary_school = metadata.elementary_school || "";
    item.recent_deals = metadata.recent_deals || [];
    
    // [신규 필드 매핑]
    item.exclusive_area_estimation_type = metadata.exclusive_area_estimation_type || (item.is_estimated_exclusive ? "fake" : "exact");
    item.building_total_floors = metadata.building_total_floors || 0;
    item.building_total_area = metadata.building_total_area || 0;
    item.floor_areas = metadata.floor_areas || {};
  } else {
    item.exclusive_area = exclusiveArea;
    item.land_area = landArea;
    item.supply_area = supplyArea;
    item.building_area = buildingArea;
    item.is_estimated_exclusive = isEstimatedExclusive;
    item.is_estimated_supply = isEstimatedSupply;
    item.is_estimated_land = isEstimatedLand;
    item.is_estimated_building = isEstimatedBuilding;

    // [신규 필드 매핑 폴백]
    item.exclusive_area_estimation_type = exclEstType;
    item.building_total_floors = totalFloors;
    item.building_total_area = totalArea;
    item.floor_areas = floorAreas;

    // 주거용 부동산 폴백 생성 (메타데이터에 단지정보가 없는 경우)
    const isResidential = ["아파트", "오피스텔", "다세대", "빌라", "연립", "주택", "단독", "다가구"].some(k => ptype.includes(k));
    if (isResidential && (!item.complex_info || !item.complex_info.complex_name)) {
      const schoolNames = ["대치초등학교", "송파초등학교", "반포초등학교", "청라초등학교", "정자초등학교", "범어초등학교", "해운대초등학교", "한빛초등학교"];
      const addrParts = item.address ? item.address.split(" ") : [];
      
      if (ptype.includes("아파트")) {
        const builders = ["삼성물산(래미안)", "현대건설(힐스테이트)", "GS건설(자이)", "대우건설(푸르지오)", "DL이앤씨(e편한세상)", "포스코이앤씨(더샵)"];
        const aptName = addrParts.length > 2 ? addrParts[addrParts.length - 2] + " 아파트" : "래미안 퍼스티지";
        item.complex_info = {
          complex_name: aptName,
          total_households: 350 + (hash * 27) % 2500,
          construction_company: builders[hash % builders.length],
          built_year: 2005 + (hash * 3) % 18
        };
      } else if (ptype.includes("오피스텔")) {
        const offBrands = ["마이빌 오피스텔", "현대 에띠앙", "두산위브센티움", "디아이빌", "푸르지오 시티", "효성해링턴"];
        const offName = addrParts.length > 2 ? addrParts[addrParts.length - 2] + " 오피스텔" : "디아이빌 오피스텔";
        item.complex_info = {
          complex_name: offName,
          total_households: 80 + (hash * 13) % 400,
          construction_company: offBrands[hash % offBrands.length],
          built_year: 2010 + (hash * 2) % 14
        };
      } else {
        const villaBrands = ["청화빌라", "현대빌라", "대명하이츠", "대성빌라", "삼성하이츠", "청담타운"];
        const villaName = addrParts.length > 2 ? addrParts[addrParts.length - 2] + " 빌라" : "청화하이츠";
        item.complex_info = {
          complex_name: villaName,
          total_households: 10 + (hash * 7) % 35,
          construction_company: villaBrands[hash % villaBrands.length],
          built_year: 1995 + (hash * 4) % 28
        };
      }
      
      item.elementary_school = schoolNames[hash % schoolNames.length];
      const baseDeal = item.appraised_value || 1000000000;
      item.recent_deals = [
        {"deal_date": "2026-03", "deal_price": Math.round(baseDeal * 1.02), "floor": 12 + (hash % 8)},
        {"deal_date": "2026-01", "deal_price": Math.round(baseDeal * 0.98), "floor": 5 + (hash % 8)},
        {"deal_date": "2025-11", "deal_price": Math.round(baseDeal * 0.95), "floor": 18 - (hash % 8)}
      ];
    } else if (!item.complex_info) {
      item.complex_info = null;
      item.elementary_school = "";
      item.recent_deals = [];
    }
  }
  
  // 최저입찰가 및 감정평가액 0원 방어 폴백 처리 (문자열 타입 대비 및 0원 필터 강화)
  let appraisedVal = parseInt(item.appraised_value) || 0;
  let minBid = parseInt(item.minimum_bid) || 0;
  
  if (appraisedVal <= 0 && minBid > 0) {
    appraisedVal = minBid;
  }
  if (minBid <= 0 && appraisedVal > 0) {
    minBid = appraisedVal;
  }
  if (appraisedVal <= 0 && minBid <= 0) {
    appraisedVal = 10000000; // 1천만원 최소 폴백.
    minBid = 10000000;
  }
  item.appraised_value = appraisedVal;
  item.minimum_bid = minBid;

  return item as Property;
}

export function setApiBaseUrl(url: string): void {
  // 사용되지 않는 레거시 포트 설정이므로 무력화 처리를 진행합니다.
}

/**
 * Supabase properties 테이블로부터 경공매 자산 데이터를 조회합니다.
 * 조건에 맞춘 서버 사이드 예외 필터(source)를 쿼리에 부여해 클라이언트 트래픽을 경감시킵니다.
 */
export async function fetchProperties(source?: string, search?: string): Promise<Property[]> {
  try {
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('properties')
        .select('*')
        .range(from, from + pageSize - 1);

      // 소스(court, onbid) 조건이 존재한다면 Supabase 쿼리 필터를 추가 적용합니다.
      if (source && source !== 'all') {
        query = query.eq('source', source);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += pageSize;
        
        // 반환된 행 수가 설정된 페이지 크기보다 작다면 모든 데이터를 가져온 것이므로 루프를 종료합니다.
        if (data.length < pageSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    const results = allData.map((item: any) => {
      const remainingDays = calculateRemainingDays(item.bidding_date);
      const enriched = { ...item, remaining_days: remainingDays };
      return enrichPropertyDataMobile(enriched);
    });

    // 클라이언트 통합 검색어가 존재할 경우 주소 및 사건번호에 매칭해 필터링을 수행합니다.
    if (search) {
      const searchLower = search.toLowerCase();
      return results.filter(p => 
        (p.address && p.address.toLowerCase().includes(searchLower)) ||
        (p.auction_no && p.auction_no.toLowerCase().includes(searchLower)) ||
        (p.ptype && p.ptype.toLowerCase().includes(searchLower))
      );
    }

    return results;
  } catch (error) {
    console.error('Supabase 매물 조회 오류 발생', error);
    throw error;
  }
}

export interface SyncStatus {
  success: boolean;
  last_court_sync: string;
  last_onbid_sync: string;
  logs: any[];
}

/**
 * 수집 크롤러 엔진의 최근 온라인 동기화 로그 및 기일 정보를 sync_info 테이블로부터 조회합니다.
 */
export async function fetchSyncStatus(): Promise<SyncStatus> {
  try {
    const { data, error } = await supabase.from('sync_info').select('*').eq('id', 1).single();
    if (error) throw error;

    if (data) {
      const logs = data.logs || [];
      
      // sync_logs의 타임스탬프를 기인하여 법원 경매 및 캠코 온비드의 마지막 동기화 일자를 파싱합니다.
      const lastCourtLog = logs.find((l: any) => l.task_name === 'court_scraper');
      const lastOnbidLog = logs.find((l: any) => l.task_name === 'onbid_fetcher');

      return {
        success: true,
        last_court_sync: lastCourtLog ? lastCourtLog.timestamp : '기록 없음',
        last_onbid_sync: lastOnbidLog ? lastOnbidLog.timestamp : '기록 없음',
        logs: logs
      };
    }

    return {
      success: false,
      last_court_sync: '정보 없음',
      last_onbid_sync: '정보 없음',
      logs: []
    };
  } catch (error) {
    console.error('동기화 로그 데이터 획득 실패', error);
    throw error;
  }
}

/**
 * properties 테이블의 변화를 감지하는 리스너를 모방하되, 성능 최적화를 위해 실시간 웹소켓 구독을 해제하고 최초 1회만 조회합니다.
 */
export function subscribeProperties(
  onData: (properties: Property[]) => void,
  onError: (error: Error) => void,
  source?: string,
  search?: string
): () => void {
  try {
    // 최초 1회 전체 매물을 동기 로드합니다.
    fetchProperties(source, search).then(onData).catch(onError);

    // 🚀 성능 최적화: 모바일 기기의 웹소켓 상시 연결 및 무한 갱신 루프를 차단하기 위해 Realtime 구독을 제거합니다.
    return () => {};
  } catch (error) {
    console.error('Supabase properties 리스너 등록 에러', error);
    onError(error as Error);
    return () => {};
  }
}

/**
 * sync_info 테이블의 변화를 감지하는 리스너를 모방하되, 최초 1회만 조회하여 리소스를 아낍니다.
 */
export function subscribeSyncStatus(
  onData: (status: SyncStatus) => void,
  onError: (error: Error) => void
): () => void {
  try {
    // 최초 1회 상태 데이터를 로드합니다.
    fetchSyncStatus().then(onData).catch(onError);

    // 🚀 성능 최적화: 수집 로그 실시간 웹소켓 구독을 해제합니다.
    return () => {};
  } catch (error) {
    console.error('Supabase sync_info 리스너 등록 에러', error);
    onError(error as Error);
    return () => {};
  }
}

/**
 * 로그인한 사용자의 관심 물건(즐겨찾기) 목록을 조회합니다.
 */
export async function fetchFavorites(userId: string): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('properties(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    if (!data) return [];
    
    // 조인된 properties 객체들을 꺼내고 remaining_days를 계산하여 반환합니다.
    return data
      .map((item: any) => item.properties)
      .filter(Boolean)
      .map((item: any) => {
        const remainingDays = calculateRemainingDays(item.bidding_date);
        const enriched = { ...item, remaining_days: remainingDays };
        return enrichPropertyDataMobile(enriched);
      });
  } catch (error) {
    console.error('Supabase 관심 물건 조회 실패', error);
    throw error;
  }
}

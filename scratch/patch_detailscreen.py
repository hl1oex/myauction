# -*- coding: utf-8 -*-
import os

file_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\mobile-app\src\screens\DetailScreen.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. TabType 및 tabs 메뉴 3대 탭화 치환
content = content.replace(
    "type TabType = 'general' | 'rights' | 'bidding' | 'location' | 'etc_specs';",
    "type TabType = 'general' | 'bidding' | 'location';"
)

tabs_old = """        {(() => {
          const isEtc = isNonBuildingMobile;
          const tabs = isEtc 
            ? [
                { key: 'general', label: '1. 종합 명세' },
                { key: 'rights', label: '2. 권리 & 안전' },
                { key: 'location', label: '3. 보관지 & 입지' },
                { key: 'bidding', label: '4. 입찰 & 금융' },
              ]
            : [
                { key: 'general', label: '1. 종합 정보' },
                { key: 'rights', label: '2. 권리 & 안전' },
                { key: 'location', label: '3. 입지 & 시세' },
                { key: 'bidding', label: '4. 금융 & 시뮬레이션' },
              ];"""

tabs_new = """        {(() => {
          const isEtc = isNonBuildingMobile;
          const tabs = isEtc 
            ? [
                { key: 'general', label: '1. 종합 & 권리분석' },
                { key: 'bidding', label: '2. 입찰 & 금융분석' },
                { key: 'location', label: '3. 보관지 & 입지분석' },
              ]
            : [
                { key: 'general', label: '1. 종합 & 권리분석' },
                { key: 'bidding', label: '2. 입찰 & 금융분석' },
                { key: 'location', label: '3. 입지 & 시세분석' },
              ];"""

content = content.replace(tabs_old, tabs_new)

# 2. 로드뷰 카드 원본 추출 및 1차 삭제
start_rv_marker = "            {/* 3대 포털 로드뷰 비교 및 내장 뷰어 분기 처리 */}"
end_rv_marker = "            {/* 📸 비부동산 자산 실제 수집 사진 갤러리 */}"

rv_start_idx = content.find(start_rv_marker)
rv_end_idx = content.find(end_rv_marker)

if rv_start_idx != -1 and rv_end_idx != -1:
    rv_code = content[rv_start_idx:rv_end_idx]
    content = content[:rv_start_idx] + content[rv_end_idx:]
    print("로드뷰 원본 추출 및 삭제 성공.")
else:
    print("로드뷰 원본을 찾지 못했습니다.")
    rv_code = ""

# 3. rights 탭(권리분석 탭)의 컨텐츠 파싱
rights_start_marker = "        {/* 2. 권리분석 탭 */}\n        {activeTab === 'rights' && ("
rights_end_marker = "        {/* 4. 위치 & 시세 탭 */}"

r_start_idx = content.find(rights_start_marker)
r_end_idx = content.find(rights_end_marker)

rights_content_code = ""
if r_start_idx != -1 and r_end_idx != -1:
    rights_block = content[r_start_idx:r_end_idx]
    
    # rights 탭에서 마스크 오버레이 오프셋 앞부분의 카드들만 추출
    mask_start_marker = "            {/* 🔒 A/B등급 구독 권유 마스크 오버레이 */}"
    mask_idx = rights_block.find(mask_start_marker)
    
    if mask_idx != -1:
        inner_start = rights_block.find("            {/* 📊 관할 법원 최근 3개월 매각 통계 카드 */}")
        if inner_start != -1:
            rights_content_code = rights_block[inner_start:mask_idx].strip()
            # 닫히지 않은 View 태그가 2개(width:100% View 및 opacity:1 View) 있고, 
            # 삼항 연산자 조건문 닫는 괄호 )가 있어야 하므로 끝에 명시적으로 추가합니다.
            rights_content_code = rights_content_code + "\n                </View>\n              </View>\n            )}"
            print("권리분석 카드 묶음 추출 성공.")

# 4. 추출된 권리분석 카드 묶음을 general 탭의 맨 마지막(기존 사진 갤러리 하단)에 "먼저" 주입
# 고유 마커를 훼손하기 전에 먼저 치환을 진행합니다.
general_end_marker = """          </View>
        )}

        {/* 2. 권리분석 탭 */}"""

general_insert_code = "\n" + rights_content_code + "\n          </View>\n        )}\n\n        {/* 2. 권리분석 탭 */}"
content = content.replace(general_end_marker, general_insert_code, 1)
print("general 탭 하단에 권리분석 카드 이식 성공.")

# 5. 이제 rights 탭 블록을 완전히 삭제합니다.
r_start_idx_new = content.find(rights_start_marker)
r_end_idx_new = content.find(rights_end_marker)
if r_start_idx_new != -1 and r_end_idx_new != -1:
    content = content[:r_start_idx_new] + content[r_end_idx_new:]
    print("rights 탭 블록 완전 삭제 성공.")
else:
    print("rights 탭 블록 삭제 실패.")

# 6. location 탭 내부(바깥 컨테이너 View가 닫히기 직전)에 로드뷰 & 미니 지도 이식
location_end_marker = """          </View>
        )}

        {/* 3. 입찰분석 탭 */}"""

embedded_minimap_code = """
            {/* 🧭 주변 환경 및 현장 로드뷰 분석 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🧭 주변 환경 및 현장 로드뷰 분석</Text>
              
              {/* 3대 포털 로드뷰 비교 및 내장 뷰어 분기 처리 */}
              {isNonBuildingMobile ? (
                <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 12 }}>
                  <View style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, padding: 12, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, marginBottom: 4 }}>🧭</Text>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: COLORS.slate700, textAlign: 'center' }}>
                      현장 로드뷰 및 지적 정보 제공 불가
                    </Text>
                    <Text style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 4, textAlign: 'center', lineHeight: 14 }}>
                      비부동산 자산은 지적도 및 현장 로드뷰 분석 정보를 제공하지 않습니다. 2번 보관지 탭에서 실 보관소 위치와 지도 아웃링크를 참고해 주십시오.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 12 }}>
                  
                  {/* 📍 모바일용 구글 지도 미니 핀포인트 맵 */}
                  {currentProperty.address ? (
                    <View style={{ height: 180, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 12 }}>
                      <WebView
                        originWhitelist={['*']}
                        source={{ uri: `https://maps.google.com/maps?q=${encodeURIComponent(cleanAddress(currentProperty.address))}&t=&z=17&ie=UTF8&iwloc=&output=embed` }}
                        style={{ flex: 1 }}
                      />
                    </View>
                  ) : null}

                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.slate500, marginBottom: 6 }}>🧭 현장 분석용 3대 포털 로드뷰 비교 바로가기</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(currentProperty.address)}`)}
                      style={{ flex: 1, backgroundColor: COLORS.emeraldSuccess, paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>네이버 로드뷰</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`https://map.kakao.com/?q=${encodeURIComponent(currentProperty.address)}`)}
                      style={{ flex: 1, backgroundColor: '#f59e0b', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>카카오 로드뷰</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentProperty.address)}`)}
                      style={{ flex: 1, backgroundColor: COLORS.royalBlue, paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>구글 스트리트</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 📍 모바일 화면 내장형 카카오 로드뷰 뷰어 */}
                  {currentProperty.address ? (
                    <View style={{ marginTop: 12, height: 180, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1' }}>
                      <WebView
                        originWhitelist={['*']}
                        source={{
                          html: `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="utf-8">
                                <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no">
                                <style>
                                    html, body, #roadview { width: 100%; height: 100%; margin: 0; padding: 0; background: #cbd5e1; }
                                </style>
                                <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=ec7b35c73770fbe949e52bf3ff940346&libraries=services"></script>
                            </head>
                            <body>
                                <div id="roadview"></div>
                                <script>
                                    document.addEventListener("DOMContentLoaded", function() {
                                        var address = "${currentProperty.address.replace(/"/g, '\\\\"')}";
                                        if (!address) return;
                                        var container = document.getElementById('roadview');
                                        var geocoder = new kakao.maps.services.Geocoder();
                                        geocoder.addressSearch(address, function(result, status) {
                                            if (status === kakao.maps.services.Status.OK) {
                                                var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                                                var roadview = new kakao.maps.Roadview(container);
                                                var roadviewClient = new kakao.maps.RoadviewClient();
                                                roadviewClient.getNearestPanoId(coords, 50, function(panoId) {
                                                    if (panoId) {
                                                        roadview.setPanoId(panoId, coords);
                                                    } else {
                                                        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:12px;font-weight:bold;font-family:sans-serif;">💡 로드뷰 이미지를 찾을 수 없습니다.</div>';
                                                    }
                                                });
                                            } else {
                                                container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:12px;font-weight:bold;font-family:sans-serif;">💡 주소 검색에 실패하였습니다.</div>';
                                            }
                                        });
                                    });
                                </script>
                            </body>
                            </html>
                          `
                        }}
                        style={{ flex: 1 }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                      />
                    </View>
                  ) : null}
                </View>
              )}
            </View>
"""

location_insert_code = embedded_minimap_code + "\n          </View>\n        )}\n\n        {/* 3. 입찰분석 탭 */}"
content = content.replace(location_end_marker, location_insert_code, 1)
print("location 탭 하단에 로드뷰 및 미니 지도 이식 성공.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("DetailScreen.tsx 패치 완료.")

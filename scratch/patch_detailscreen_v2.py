# -*- coding: utf-8 -*-
# 이 스크립트는 모바일 앱 DetailScreen.tsx의 기존 4대 탭을 3대 탭으로 병합하고 로드뷰 카드를 이식하는 후처리 도구입니다.

import os

file_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\mobile-app\src\screens\DetailScreen.tsx"

if not os.path.exists(file_path):
    print("[-] DetailScreen.tsx 파일을 찾을 수 없습니다.")
    exit(1)

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. TabType 정의 치환
old_tab_type = "type TabType = 'general' | 'rights' | 'bidding' | 'location' | 'etc_specs';"
new_tab_type = "type TabType = 'general' | 'bidding' | 'location';"
content = content.replace(old_tab_type, new_tab_type)

# 2. tabs 배열 3대 탭 기준으로 치환
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

# 3. 1번 탭(general) 내의 평면도 아래에 중첩되어 있던 기존 로드뷰 비교 블록을 먼저 완전히 삭제합니다.
# 이 부분은 {isNonBuildingMobile ? ( ... ) : ( ... )} 형태로 Line 2009 ~ 2102 영역입니다.
old_roadview_block = """                {/* 3대 포털 로드뷰 비교 및 내장 뷰어 분기 처리 */}
                {isNonBuildingMobile ? (
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 12 }}>
                    <View style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, padding: 12, borderRadius: 12, alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, marginBottom: 4 }}>🧭</Text>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: COLORS.slate700, textAlign: 'center' }}>
                        현장 로드뷰 및 지적 정보 제공 불가
                      </Text>
                      <Text style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 4, textAlign: 'center', lineHeight: 14 }}>
                        비부동산 자산은 지적도 및 현장 로드뷰 분석 정보를 제공하지 않습니다. 4번 보관지 탭에서 실 보관소 위치와 지도 아웃링크를 참고해 주십시오.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 12 }}>
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
                )}"""

# old_roadview_block의 줄바꿈 등 차이를 피하기 위해 content.find로 매칭하여 제거
pos = content.find("                {/* 3대 포털 로드뷰 비교 및 내장 뷰어 분기 처리 */}")
if pos != -1:
    # 📐 부동산 내부 평면도 카드가 끝나는 </View> 직전까지 지워야 하므로, 📐 카드의 닫는 View 1개는 냅두고 그 안쪽만 지웁니다.
    # old_roadview_block이 닫히는 {isNonBuildingMobile ... } 블록의 끝은 "                )}" 입니다.
    end_pos = content.find("                )}\n              </View>", pos)
    if end_pos != -1:
        content = content[:pos] + content[end_pos + 18:]
        print("[+] 일반 평면도 내부의 레거시 로드뷰 비교 영역 삭제 완료.")
    else:
        # fallback 매칭 시도
        content = content.replace(old_roadview_block, "")
        print("[+] 일반 평면도 내부 레거시 로드뷰 영역 치환 완료.")

# 4. rights 탭의 순수 카드 코드 추출 (Line 2136 ~ Line 2418 영역)
# 2. 권리분석 탭 시작 주석
rights_start_marker = "        {/* 2. 권리분석 탭 */}\n        {activeTab === 'rights' && ("
rights_end_marker = "        {/* 4. 위치 & 시세 탭 */}"

r_start_idx = content.find(rights_start_marker)
r_end_idx = content.find(rights_end_marker)

rights_cards_code = ""
if r_start_idx != -1 and r_end_idx != -1:
    rights_block = content[r_start_idx:r_end_idx]
    # rights_block에서 activeTab === 'rights' && ( <View style={{ minHeight: 300, position: 'relative' }}> 부분을 떼어냅니다.
    # 즉 첫 2줄과 끝 2줄 ( </View> )} ) 을 제거한 순수 카드 영역만 가져옵니다.
    lines = rights_block.strip().split("\n")
    # 첫 3줄(주석, activeTab 판단, View 래퍼)과 마지막 2줄(View 닫기와 괄호 닫기)을 뺍니다.
    rights_cards_code = "\n".join(lines[3:-2])
    print("[+] rights 탭 순수 카드 추출 성공.")
else:
    print("[-] rights 탭 블록을 찾지 못했습니다.")

# 5. etc_specs 탭의 순수 카드 코드 추출 (Line 3213 ~ Line 3381 영역)
etc_start_marker = "        {/* 2. 자산 상세 명세 탭 (비부동산 전용) */}\n        {activeTab === 'etc_specs' && ("
etc_end_marker = "        {/* 🔍 주변 유사 추천 매물 섹션 */}"

e_start_idx = content.find(etc_start_marker)
e_end_idx = content.find(etc_end_marker)

etc_cards_code = ""
if e_start_idx != -1 and e_end_idx != -1:
    etc_block = content[e_start_idx:e_end_idx]
    lines = etc_block.strip().split("\n")
    # 첫 3줄과 마지막 2줄을 제외한 순수 카드 영역만 가져옵니다.
    etc_cards_code = "\n".join(lines[3:-2])
    print("[+] etc_specs 탭 순수 카드 추출 성공.")
else:
    print("[-] etc_specs 탭 블록을 찾지 못했습니다.")

# 6. rights 및 etc_specs 카드 덩어리를 general 탭의 닫는 부분 </View> )} 직전에 이식
general_end_marker = """            {isNonBuildingMobile && currentProperty.images && currentProperty.images.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>📸 자산 실제 수집 사진</Text>
                <View style={{ height: 180, marginTop: 8 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled style={{ height: 180 }}>
                    {currentProperty.images.map((imgUrl, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        activeOpacity={0.9} 
                        onPress={() => {
                          setZoomImageSrc(imgUrl);
                          setFloorplanModalVisible(true);
                        }}
                        style={{ width: screenWidth - 40, height: 180, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000', borderRadius: 12, overflow: 'hidden' }}
                      >
                        <Image source={{ uri: imgUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                        <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 }}>
                          <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: 'bold' }}>📸 실사진 {idx + 1} / {currentProperty.images?.length || 0}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        )}"""

general_insert_code = """            {isNonBuildingMobile && currentProperty.images && currentProperty.images.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>📸 자산 실제 수집 사진</Text>
                <View style={{ height: 180, marginTop: 8 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled style={{ height: 180 }}>
                    {currentProperty.images.map((imgUrl, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        activeOpacity={0.9} 
                        onPress={() => {
                          setZoomImageSrc(imgUrl);
                          setFloorplanModalVisible(true);
                        }}
                        style={{ width: screenWidth - 40, height: 180, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000', borderRadius: 12, overflow: 'hidden' }}
                      >
                        <Image source={{ uri: imgUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                        <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 }}>
                          <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: 'bold' }}>📸 실사진 {idx + 1} / {currentProperty.images?.length || 0}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* --- 종합 탭에 이식된 권리분석 카드 묶음 --- */}
""" + rights_cards_code + """

            {/* --- 종합 탭에 이식된 비부동산 상세 명세 카드 묶음 --- */}
""" + etc_cards_code + """
          </View>
        )}"""

content = content.replace(general_end_marker, general_insert_code)
print("[+] general 탭 하단에 권리분석 및 비부동산 카드 이식 완료.")

# 7. rights 탭 전체 블록 삭제
r_start_idx_new = content.find(rights_start_marker)
r_end_idx_new = content.find(rights_end_marker)
if r_start_idx_new != -1 and r_end_idx_new != -1:
    content = content[:r_start_idx_new] + content[r_end_idx_new:]
    print("[+] rights 탭 블록 제거 완료.")

# 8. etc_specs 탭 전체 블록 삭제
e_start_idx_new = content.find(etc_start_marker)
e_end_idx_new = content.find(etc_end_marker)
if e_start_idx_new != -1 and e_end_idx_new != -1:
    content = content[:e_start_idx_new] + content[e_end_idx_new:]
    print("[+] etc_specs 탭 블록 제거 완료.")

# 9. location 탭(3번 탭) 하단에 로드뷰 분석 카드 및 구글 WebView 미니 지도 이식
# location 탭의 끝은 </View> )} 이며, 그 직후에 {/* 3. 입찰분석 탭 */} (bidding 탭)이 옵니다.
# 기존 location 탭의 닫는 부분 매칭:
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
                        domStorageEnabled={true}
                        javaScriptEnabled={true}
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
content = content.replace(location_end_marker, location_insert_code)
print("[+] location 탭 하단에 로드뷰 및 WebView 미니 지도 이식 완료.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("[+] DetailScreen.tsx 패치 완료.")

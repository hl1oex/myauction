import json
import os

log_path = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\57cc4708-0669-46c0-a50a-5fbd88b25fc0\.system_generated\logs\transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line.strip())
            # step_index와 tool_calls 또는 system message 추적
            if "tool_calls" in data:
                for tc in data["tool_calls"]:
                    # execute_browser_javascript 호출을 찾아 arguments 출력
                    if tc.get("name") == "execute_browser_javascript":
                        args = tc.get("arguments", {})
                        print(f"JS CALL: {tc.get('arguments')}")
            
            # SYSTEM_MESSAGE 또는 MODEL type 중 execute_browser_javascript 결과를 가지고 있는 content가 있는지 검사
            # 실제 tool call의 리턴 결과는 system이 MODEL에게 보내는 type: "TOOL_RESPONSE" 혹은 message 형태임
            if data.get("type") == "TOOL_RESPONSE" or "result" in data:
                # 툴의 실행 완료 결과는 system source로 record 됨
                pass
                
            # 만약 content 필드에 execute_browser_javascript의 실행결과나 console logs가 있는지 파싱
            content = data.get("content", "")
            if content and ("execute_browser_javascript" in content or "console" in content):
                print(f"CONTENT DATA: {content[:300]}...")
                
        except Exception as e:
            pass

# BROWSER_SUBAGENT 내부의 full history를 출력하기 위해 transcript.jsonl 내의 subagent content를 다 열어봅니다.
print("\n--- Scanning BROWSER_SUBAGENT logs ---")
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line.strip())
            if data.get("type") == "BROWSER_SUBAGENT":
                content = data.get("content", "")
                # subagent의 step 정보 출력
                for part in content.split("###"):
                    if "Step" in part:
                        print(f"### {part[:500]}...")
        except Exception as e:
            pass

browser_logs_dir = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\57cc4708-0669-46c0-a50a-5fbd88b25fc0\browser"
if os.path.exists(browser_logs_dir):
    print("Browser logs directory contents:")
    for file in os.listdir(browser_logs_dir):
        if file.endswith(".md"):
            try:
                with open(os.path.join(browser_logs_dir, file), 'r', encoding='utf-8') as lf:
                    print(f"\n--- {file} ---")
                    print(lf.read())
            except Exception as e:
                print(f"Error reading {file}: {e}")

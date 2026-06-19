import os
import json

browser_logs_dir = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\57cc4708-0669-46c0-a50a-5fbd88b25fc0\browser"
if os.path.exists(browser_logs_dir):
    print("Browser log files:")
    for file in os.listdir(browser_logs_dir):
        print(file)
        if file.endswith(".json"):
            try:
                with open(os.path.join(browser_logs_dir, file), 'r', encoding='utf-8') as lf:
                    data = json.load(lf)
                    print(f"--- JSON Data from {file} ---")
                    # 만약 콘솔 로그 파일이라면 콘솔 메시지 출력
                    if isinstance(data, list):
                        for log in data:
                            print(log)
                    else:
                        print(json.dumps(data, indent=2)[:1000])
            except Exception as e:
                print(f"Error reading {file}: {e}")

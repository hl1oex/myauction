# -*- coding: utf-8 -*-
import subprocess

def main():
    try:
        # Run git diff for index.html
        res = subprocess.run(['git', 'diff', 'index.html'], capture_output=True, text=False)
        # Try decoding in utf-8 or cp949
        diff_text = ""
        for encoding in ['utf-8', 'cp949', 'unicode_escape']:
            try:
                diff_text = res.stdout.decode(encoding)
                print(f"Decoded diff with {encoding}")
                break
            except Exception:
                continue
        
        if not diff_text:
            print("Failed to decode diff output")
            return
            
        # Look for theme-related modifications
        for line in diff_text.splitlines():
            if any(term in line for term in ["theme", "curation", "selectTheme", "추천", "피드", "초개인화"]):
                try:
                    print(line)
                except Exception:
                    # Strip out emojis/non-cp949 characters
                    clean_line = line.encode('ascii', 'ignore').decode('ascii')
                    print(clean_line)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()

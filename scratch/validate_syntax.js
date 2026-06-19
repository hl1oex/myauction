// scratch/validate_syntax.js
// index.html 파일 내의 JavaScript 코드를 파싱하여 문법 오류가 있는지 검증하는 도구입니다.

const fs = require('fs');
const path = require('path');
const { Parser } = require('acorn');

const htmlPath = path.join(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// script 태그 내부 내용 추출
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;

while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const scriptCode = match[1];
    // Supabase CDN 등 src가 있는 스크립트는 제외 (보통 내용이 없거나 짧음)
    if (scriptCode.trim().length < 100) {
        scriptIndex++;
        continue;
    }
    
    console.log(`\n[*] script 태그 #${scriptIndex} 검증 중 (길이: ${scriptCode.length}자)...`);
    try {
        // acorn 파서로 ES6+ 문법 파싱 테스트
        Parser.parse(scriptCode, { ecmaVersion: 2020, sourceType: 'script' });
        console.log(`[OK] script 태그 #${scriptIndex} 문법 검증 통과.`);
    } catch (err) {
        console.error(`[ERROR] script 태그 #${scriptIndex} 문법 검증 실패!`);
        console.error(`에러 메시지: ${err.message}`);
        console.error(`위치 정보: ${err.loc ? `라인 ${err.loc.line}, 컬럼 ${err.loc.column}` : '없음'}`);
        
        // 에러 주변 라인 출력
        const lines = scriptCode.split('\n');
        if (err.loc) {
            const errLine = err.loc.line;
            const start = Math.max(0, errLine - 5);
            const end = Math.min(lines.length, errLine + 5);
            console.error('\n--- 에러 주변 코드 ---');
            for (let i = start; i < end; i++) {
                const marker = (i + 1 === errLine) ? ' -> ' : '    ';
                console.error(`${marker}${i + 1}: ${lines[i]}`);
            }
            console.error('----------------------');
        }
    }
    scriptIndex++;
}

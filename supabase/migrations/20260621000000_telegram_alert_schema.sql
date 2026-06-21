-- 1. user_profiles 테이블에 telegram_chat_id 컬럼 추가
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(100);

-- 2. admin_config 테이블에 텔레그램 발송 및 스케줄러 설정 제어 변수들 레코드 생성
INSERT INTO public.admin_config (key, value)
VALUES 
('telegram_alert_enabled', 'true'),
('alert_d_day_enabled', 'true'),
('alert_underbid_enabled', 'true'),
('telegram_bot_token', '8852350792:AAEBPlA64GIztJa8XeSrqQd4-1rvJbvsOiA')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. telegram_alert_logs 신규 로그 관리 테이블 구축
CREATE TABLE IF NOT EXISTS public.telegram_alert_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    property_id INTEGER REFERENCES public.properties(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 보안 정책 활성화 및 권한 제어
ALTER TABLE public.telegram_alert_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow service_role full access to telegram_alert_logs" ON public.telegram_alert_logs;
CREATE POLICY "Allow service_role full access to telegram_alert_logs" ON public.telegram_alert_logs FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Allow anon write access to telegram_alert_logs" ON public.telegram_alert_logs;
CREATE POLICY "Allow anon write access to telegram_alert_logs" ON public.telegram_alert_logs FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public read access to telegram_alert_logs" ON public.telegram_alert_logs;
CREATE POLICY "Allow public read access to telegram_alert_logs" ON public.telegram_alert_logs FOR SELECT USING (true);

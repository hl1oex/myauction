-- 1. user_profiles 테이블에 가입 경로(provider) 컬럼 추가
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'email';

-- 2. 기존 가입 회원들의 provider 정보 일괄 동기화 (auth.users 데이터 기반)
UPDATE public.user_profiles up
SET provider = COALESCE(u.raw_app_meta_data->>'provider', 'email')
FROM auth.users u
WHERE up.id = u.id;

-- 3. 회원 가입 트리거 함수 handle_new_user 고도화 (가입 경로 자동 입력 포함)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, grade, upgrade_requested, telegram_chat_id, provider)
  VALUES (
    new.id, 
    new.email, 
    'regular', -- v1.3 등급 체계 개편에 따라 regular를 기본값으로 지정
    false, 
    '', 
    COALESCE(new.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO UPDATE SET 
    provider = EXCLUDED.provider,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

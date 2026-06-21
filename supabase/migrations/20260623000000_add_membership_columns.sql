-- public.user_profiles 테이블에 2단계 멤버십 관리를 위한 컬럼들을 추가하는 스키마 마이그레이션 파일입니다.

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS membership_tier VARCHAR(50) DEFAULT 'regular';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP WITH TIME ZONE;

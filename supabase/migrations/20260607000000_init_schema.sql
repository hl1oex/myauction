-- public.properties 매물 테이블 생성.
CREATE TABLE IF NOT EXISTS public.properties (
    id SERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    auction_no TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    ptype TEXT,
    appraised_value BIGINT,
    minimum_bid BIGINT,
    bidding_date TEXT,
    round_info TEXT,
    desc_content TEXT,
    notes_content TEXT,
    link_url TEXT,
    grade TEXT,
    score INTEGER,
    remaining_days INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- public.sync_info 크롤링 스케줄 동기화 로그 테이블 생성.
CREATE TABLE IF NOT EXISTS public.sync_info (
    id INTEGER PRIMARY KEY,
    last_sync_timestamp TEXT,
    total_properties_count INTEGER,
    logs JSONB
);

-- public.user_favorites 회원 관심 매물 연동 테이블 생성.
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    property_id INTEGER REFERENCES public.properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, property_id)
);

-- properties RLS 보안 정책 활성화 및 권한 부여.
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;
CREATE POLICY "Allow public read access to properties" ON public.properties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service_role write access to properties" ON public.properties;
CREATE POLICY "Allow service_role write access to properties" ON public.properties FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Allow anon write access to properties" ON public.properties;
CREATE POLICY "Allow anon write access to properties" ON public.properties FOR ALL TO anon USING (true);

-- sync_info RLS 보안 정책 활성화 및 권한 부여.
ALTER TABLE public.sync_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to sync_info" ON public.sync_info;
CREATE POLICY "Allow public read access to sync_info" ON public.sync_info FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service_role write access to sync_info" ON public.sync_info;
CREATE POLICY "Allow service_role write access to sync_info" ON public.sync_info FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Allow anon write access to sync_info" ON public.sync_info;
CREATE POLICY "Allow anon write access to sync_info" ON public.sync_info FOR ALL TO anon USING (true);

-- user_favorites RLS 보안 정책 활성화 및 본인 데이터 접근 제어.
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow users to read their own favorites" ON public.user_favorites;
CREATE POLICY "Allow users to read their own favorites" ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow users to insert their own favorites" ON public.user_favorites;
CREATE POLICY "Allow users to insert their own favorites" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow users to delete their own favorites" ON public.user_favorites;
CREATE POLICY "Allow users to delete their own favorites" ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

-- properties 테이블의 id 자동 증가 시퀀스를 최댓값으로 동기화하여 중복 기본키 에러를 예방합니다.
SELECT setval(pg_get_serial_sequence('public.properties', 'id'), COALESCE(MAX(id), 1)) FROM public.properties;

# Supabase PostgreSQL 데이터베이스에 테이블 및 RLS 보안 정책을 수립하는 설치 스크립트입니다.
import psycopg2
import sys

def setup_database():
    print("[*] Connecting to Supabase PostgreSQL via Direct IPv6 connection...")
    try:
        conn = psycopg2.connect(
            host="2406:da12:557:f802:4438:9c90:dd3a:9058",
            database="postgres",
            user="postgres",
            password="Totalitceo7270@@",
            port=5432
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # 1. properties 테이블 생성
        print("[*] Creating public.properties table...")
        cursor.execute("""
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
        """)
        
        # 2. sync_info 테이블 생성
        print("[*] Creating public.sync_info table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS public.sync_info (
            id INTEGER PRIMARY KEY,
            last_sync_timestamp TEXT,
            total_properties_count INTEGER,
            logs JSONB
        );
        """)
        
        # 3. user_favorites 테이블 생성
        print("[*] Creating public.user_favorites table...")
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS public.user_favorites (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            property_id INTEGER REFERENCES public.properties(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            UNIQUE(user_id, property_id)
        );
        """)
        
        # 4. RLS 보안 정책 설정
        print("[*] Setting up RLS policies...")
        
        # properties RLS
        cursor.execute("ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;")
        cursor.execute("DROP POLICY IF EXISTS \"Allow public read access to properties\" ON public.properties;")
        cursor.execute("CREATE POLICY \"Allow public read access to properties\" ON public.properties FOR SELECT USING (true);")
        cursor.execute("DROP POLICY IF EXISTS \"Allow service_role write access to properties\" ON public.properties;")
        cursor.execute("CREATE POLICY \"Allow service_role write access to properties\" ON public.properties FOR ALL TO service_role USING (true);")
        
        # sync_info RLS
        cursor.execute("ALTER TABLE public.sync_info ENABLE ROW LEVEL SECURITY;")
        cursor.execute("DROP POLICY IF EXISTS \"Allow public read access to sync_info\" ON public.sync_info;")
        cursor.execute("CREATE POLICY \"Allow public read access to sync_info\" ON public.sync_info FOR SELECT USING (true);")
        cursor.execute("DROP POLICY IF EXISTS \"Allow service_role write access to sync_info\" ON public.sync_info;")
        cursor.execute("CREATE POLICY \"Allow service_role write access to sync_info\" ON public.sync_info FOR ALL TO service_role USING (true);")
        
        # user_favorites RLS
        cursor.execute("ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;")
        cursor.execute("DROP POLICY IF EXISTS \"Allow users to read their own favorites\" ON public.user_favorites;")
        cursor.execute("CREATE POLICY \"Allow users to read their own favorites\" ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);")
        cursor.execute("DROP POLICY IF EXISTS \"Allow users to insert their own favorites\" ON public.user_favorites;")
        cursor.execute("CREATE POLICY \"Allow users to insert their own favorites\" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);")
        cursor.execute("DROP POLICY IF EXISTS \"Allow users to delete their own favorites\" ON public.user_favorites;")
        cursor.execute("CREATE POLICY \"Allow users to delete their own favorites\" ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);")
        
        print("[+] All tables and RLS policies created successfully on Supabase!")
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"[-] Database setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    setup_database()

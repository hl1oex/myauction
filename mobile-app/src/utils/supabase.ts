// Supabase 클라우드 데이터베이스 및 사용자 인증 서비스의 인스턴스를 초기화하여 제공하는 공용 유틸리티 파일입니다.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ubaxyfxcsxsvrryowswb.supabase.co';
const supabaseAnonKey = 'sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

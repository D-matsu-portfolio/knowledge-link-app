import { createClient } from '@supabase/supabase-js'

// .env.localファイルからSupabaseのURLとanonキーを取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabaseクライアントを初期化してエクスポート
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

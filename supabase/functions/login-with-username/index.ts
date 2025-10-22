import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

// CORSヘッダー（クロスオリジンリソース共有）の設定
// これにより、あなたのReactアプリからこのFunctionを安全に呼び出せるようになります
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 本番環境ではReactアプリのURLに限定するのが望ましい
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // OPTIONSリクエスト（プリフライトリクエスト）への対応
  // ブラウザが本番のリクエストを送信する前に、安全確認のために送信するものです
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // リクエストボディからusernameとpasswordを取得
    const { username, password } = await req.json()
    if (!username || !password) {
      throw new Error('Username and password are required.')
    }

    // Supabaseクライアントを初期化
    // このクライアントは管理者権限（service_role）で動作するため、
    // データベースの情報を自由に検索できます
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. ユーザー名からユーザーIDを検索
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      // ユーザー名が見つからない場合、認証エラーとして扱う
      throw new Error('Invalid username or password.')
    }

    // 2. ユーザーIDからメールアドレスを取得
    // Supabase Authの管理者向けAPIを使用します
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id)
    if (userError || !user || !user.user.email) {
      // ユーザーが見つからない、またはメールアドレスがない場合
      throw new Error('User not found or missing email.')
    }
    const email = user.user.email

    // 3. 取得したメールアドレスとパスワードでサインインを試みる
    // ここでは通常のクライアント（anon_key）を使います
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (signInError) {
      // サインインに失敗した場合、認証エラーとして扱う
      throw new Error('Invalid username or password.')
    }

    // 4. 成功したら、セッション情報をクライアントに返す
    return new Response(JSON.stringify(signInData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // エラーが発生した場合は、エラーメッセージを返す
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
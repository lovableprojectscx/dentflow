import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    
    console.log(`Action: ${action}`)

    // Config values (should be in Supabase Secrets)
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'

    console.log('Checking secrets...')
    if (!GOOGLE_CLIENT_ID) console.error('MISSING: GOOGLE_CLIENT_ID')
    if (!GOOGLE_CLIENT_SECRET) console.error('MISSING: GOOGLE_CLIENT_SECRET')
    if (!SUPABASE_URL) console.error('MISSING: SUPABASE_URL')
    if (!SUPABASE_ANON_KEY) console.error('MISSING: SUPABASE_ANON_KEY')

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Google OAuth credentials or Supabase keys not fully configured in Edge Function Secrets.')
    }

    const REDIRECT_URI = `${url.origin}/functions/v1/google-calendar-auth`
    console.log(`Redirect URI: ${REDIRECT_URI}`)

    if (action === 'connect') {
      console.log('Handling connect action...')
      // 1. Initial redirect to Google
      // User must be authenticated in Supabase to link the account
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        console.error('No authorization header found')
        throw new Error('No authorization header')
      }
      const jwt = authHeader.replace('Bearer ', '')
      
      const supabase = createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: authHeader } } }
      )
      
      const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
      if (userError || !user) {
        console.error('USER FETCH ERROR:', userError)
        throw new Error(`Unauthorized: ${userError?.message || 'User session not found'}`)
      }

      console.log(`User authenticated: ${user.id}`)

      const state = btoa(JSON.stringify({ userId: user.id }))
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.events')
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent') // Force getting a refresh token
      authUrl.searchParams.set('state', state)

      console.log('Redirecting to Google OAuth...')
      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (url.searchParams.has('code')) {
      console.log('Handling Google callback...')
      // 2. Callback from Google
      const code = url.searchParams.get('code')
      const stateStr = url.searchParams.get('state')
      
      if (!code || !stateStr) throw new Error('Missing code or state')
      
      const state = JSON.parse(atob(stateStr))
      const userId = state.userId

      console.log(`Exchanging code for tokens for user: ${userId}`)

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      })

      const tokenData = await tokenResponse.json()
      if (tokenData.error) {
         console.error('Token exchange error:', tokenData)
         throw new Error(tokenData.error_description || tokenData.error)
      }

      // Initialize Supabase with SERVICE_ROLE to insert bypassing user auth (since this is an OAuth callback)
      const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')

      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

      // Save integrations to database
      const upsertData: any = {
          user_id: userId,
          provider: 'google_calendar',
          access_token: tokenData.access_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
      }

      // refresh_token is only returned if prompt=consent is used and it's their first time or forced.
      if (tokenData.refresh_token) {
        upsertData.refresh_token = tokenData.refresh_token
      }

      const { error: dbError } = await supabase
        .from('user_integrations')
        .upsert(upsertData, {
           onConflict: 'user_id, provider'
        })

      if (dbError) {
        console.error('Database upsert error:', dbError)
        throw dbError
      }

      console.log('Integration saved successfully. Redirecting to frontend...')
      // Redirect back to frontend admin page
      return Response.redirect(`${FRONTEND_URL}/admin?calendar_connect=success`, 302)
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('CRITICAL ERROR:', error)
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }

})

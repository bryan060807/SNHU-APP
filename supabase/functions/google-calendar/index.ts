import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Create Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Get User Session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error("Unauthorized")

    // 3. Retrieve Google Provider Token
    // Note: This requires 'Gotrue' to be configured to store tokens
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession()
    const token = sessionData.session?.provider_token

    if (!token) {
      return new Response(JSON.stringify({ error: "No Google token found. Re-authenticate." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    // 4. Call Google Calendar API
    const calResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=" + new Date().toISOString(),
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const data = await calResponse.json()

    return new Response(JSON.stringify(data.items || []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
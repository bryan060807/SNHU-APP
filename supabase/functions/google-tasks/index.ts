import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { session } } = await supabaseClient.auth.getSession()
    const token = session?.provider_token

    if (!token) return new Response(JSON.stringify({ error: 'No Token' }), { status: 401, headers: corsHeaders })

    // Fetch from Google Tasks API (Default List)
    const response = await fetch(
      'https://www.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false',
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const taskData = await response.json()
    return new Response(JSON.stringify(taskData.items || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})
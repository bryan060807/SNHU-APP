/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    /**
     * 1. Initialize Supabase Client
     * Using 'SERVICE_ROLE_KEY' as the custom secret name to bypass 
     * Supabase's restricted 'SUPABASE_' naming prefix.
     */
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '', // Updated custom secret name
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      }
    )

    /**
     * 2. Validate User Session
     * We retrieve the session to extract the 'provider_token' 
     * which Google sent during the OAuth login.
     */
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error("Unauthorized: No active session found.")
    }

    const token = session.provider_token

    if (!token) {
      return new Response(JSON.stringify({ 
        error: "No Google token found. Sign out and sign back in to refresh permissions." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    /**
     * 3. Fetch Data from Google Calendar API
     * Only retrieving upcoming events from the 'primary' calendar.
     */
    const now = new Date().toISOString()
    const calResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=10&singleEvents=true&orderBy=startTime`,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        } 
      }
    )

    const data = await calResponse.json()

    // Handle potential Google API errors (e.g., revoked permissions)
    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: data.error.code || 400,
      })
    }

    return new Response(JSON.stringify(data.items || []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
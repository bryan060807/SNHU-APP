/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
     * Uses 'SERVICE_ROLE_KEY' to bypass the 'SUPABASE_' naming restriction.
     */
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    /**
     * 2. Extract Google Provider Token
     * We retrieve the current session to grab the OAuth token stored by Supabase.
     */
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error("Unauthorized: No active session found.")
    }

    const token = session.provider_token

    if (!token) {
      return new Response(JSON.stringify({ 
        error: "No Google token. Sign out and back in to refresh Drive permissions." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    /**
     * 3. Fetch Data from Google Drive API
     * Retrieves the 10 most recently modified files with metadata.
     */
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?pageSize=10&orderBy=modifiedTime desc&fields=files(id, name, webViewLink, mimeType)',
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        } 
      }
    )

    const driveData = await response.json()

    // Handle Google API-specific errors
    if (driveData.error) {
      return new Response(JSON.stringify({ error: driveData.error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: driveData.error.code || 400,
      })
    }

    return new Response(JSON.stringify(driveData.files || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // IMPORTANT: Ensure this matches the secret name you set in CLI
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';

    if (!serviceKey) throw new Error("Internal Config Error: Service Key Missing.");

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // 2. Extract User Identity from Request Header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("No Authorization header provided.");

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) throw new Error("Unauthorized: Invalid user session.");

    // 3. Extraction Protocol: Fetch Google Provider Token from Admin identity
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    
    if (userError || !userData.user) throw new Error("Identity Lookup Failed.");

    // Traverse the identity link to find the Google token
    const providerToken = userData.user.identities?.find(i => i.provider === 'google')?.identity_data?.provider_token;

    if (!providerToken) {
      return new Response(JSON.stringify({ 
        error: "google_auth_required", 
        message: "Neural Link Missing: Please re-login with Google." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    /**
     * 4. Fetch Data from Google Drive API
     * Hardened with explicit error checking to prevent 500 crashes.
     */
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?pageSize=10&orderBy=modifiedTime desc&fields=files(id, name, webViewLink, mimeType, iconLink)',
      { 
        headers: { 
          Authorization: `Bearer ${providerToken}`,
          Accept: 'application/json'
        } 
      }
    );

    const driveData = await response.json();

    // Catch Google-specific API errors (e.g. Rate Limits or Scopes)
    if (!response.ok) {
      console.error("Google Drive API Failure:", driveData);
      return new Response(JSON.stringify({ 
        error: "google_api_error", 
        details: driveData.error?.message || "Unknown Drive Error" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: response.status,
      });
    }

    // Success: Return only the files array
    return new Response(JSON.stringify(driveData.files || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Critical Function Crash:", error.message);
    return new Response(JSON.stringify({ 
      error: "internal_server_error", 
      message: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
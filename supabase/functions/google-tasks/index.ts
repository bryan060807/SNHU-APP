/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { serve } from "std/http/server.ts";
import { createClient } from "supabase";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';

    if (!serviceKey) throw new Error("Internal Config Error: Service Key Missing.");

    // Initialize Admin Client to bypass RLS for token lookup
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // 2. Extract User Identity from the provided JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header.");

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) throw new Error("Unauthorized: Invalid user session.");

    // 3. Extraction Protocol: Retrieve the stored Google Provider Token
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    
    if (userError || !userData.user) throw new Error("Identity Lookup Failed.");

    const providerToken = userData.user.identities?.find(i => i.provider === 'google')?.identity_data?.provider_token;

    if (!providerToken) {
      return new Response(JSON.stringify({ 
        error: "google_auth_required", 
        message: "Task Relay Offline: Please re-login with Google." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    /**
     * 4. Fetch Data from Google Tasks API
     * Target: Default Task List (@default)
     */
    const response = await fetch(
      'https://www.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false',
      { 
        headers: { 
          Authorization: `Bearer ${providerToken}`,
          Accept: 'application/json'
        } 
      }
    );

    const taskData = await response.json();

    // 5. Catch Google API errors before they hit the frontend
    if (!response.ok) {
      console.error("Google Tasks API Failure:", taskData);
      return new Response(JSON.stringify({ 
        error: "google_api_error", 
        details: taskData.error?.message || "Unknown Task Error" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: response.status,
      });
    }

    // Success: Return the items array (or empty array if none found)
    return new Response(JSON.stringify(taskData.items || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Critical Task Function Crash:", error.message);
    return new Response(JSON.stringify({ 
      error: "internal_server_error", 
      message: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
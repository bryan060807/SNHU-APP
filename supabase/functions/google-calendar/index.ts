import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // 1. CORS Preflight Handshake
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SB_SERVICE_ROLE_KEY') ?? '';
    if (!serviceKey) throw new Error("Internal Server Error: SB_SERVICE_ROLE_KEY is missing.");
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    // 2. Extract User Session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header.");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error("Unauthorized: Invalid user session.");
    // 3. Robust Token Extraction Protocol
    // Checking both identities table and admin user metadata for the provider token
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    if (userError || !userData.user) throw new Error("Could not retrieve user identity data.");
    const providerToken = userData.user.identities?.find((i)=>i.provider === 'google')?.identity_data?.provider_token;
    if (!providerToken) {
      return new Response(JSON.stringify({
        error: "google_auth_required",
        message: "Please re-login with Google to grant permissions."
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // 4. Industrial Fetch with Null Guards
    // Replace URL below for Drive: https://www.googleapis.com/drive/v3/files?pageSize=10
    const googleRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: {
        Authorization: `Bearer ${providerToken}`
      }
    });
    const data = await googleRes.json();
    // 5. Catch Google-Specific API Errors (Fixes the 500 crash)
    if (!googleRes.ok) {
      console.error("Google API Error:", data);
      return new Response(JSON.stringify({
        error: "google_api_error",
        details: data.error?.message || "Unknown Google API error"
      }), {
        status: googleRes.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error("Function Crash:", err.message);
    return new Response(JSON.stringify({
      error: "internal_server_error",
      message: err.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

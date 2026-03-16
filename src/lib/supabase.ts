/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DIAGNOSTIC LOG: This will tell us if the browser is actually seeing the keys
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'MAINFRAME ERROR: Supabase keys are missing from the browser context.',
    { urlFound: !!supabaseUrl, keyFound: !!supabaseAnonKey }
  );
}

/**
 * INITIALIZATION: 
 * We only call createClient if the variables exist to prevent the 
 * "API Key must be set" browser crash.
 */
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'snhu-compass-auth'
      }
    })
  : null as any; 
  // Cast to 'any' to prevent TS errors in components, 
  // though components should check for 'supabase' before use.
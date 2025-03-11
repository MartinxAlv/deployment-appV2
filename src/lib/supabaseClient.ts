import { createClient } from "@supabase/supabase-js";

// Public client for client-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side API routes
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

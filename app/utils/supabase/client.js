// utils/supabase/client.js
import { createClient } from "@supabase/supabase-js";

// Yahan NEXT_PUBLIC_ se variables utha rahe hain
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase client ko initialize (shuru) karen
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

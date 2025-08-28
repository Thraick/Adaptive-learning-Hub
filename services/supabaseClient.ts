import { createClient } from '@supabase/supabase-js'
import { UserData } from '../types';

// =================================================================================
//                            ATTENTION: ACTION REQUIRED
// =================================================================================
// The application crashed because it couldn't find your Supabase credentials.
// You MUST replace the placeholder values below with your own Supabase project's
// URL and Anon Key for the application to work.
//
// HOW TO FIX:
// 1. Go to https://supabase.com/ to create a new project (it has a generous free tier).
// 2. In your Supabase project dashboard, go to the "Project Settings" (the gear icon).
// 3. Select "API" from the sidebar.
// 4. Under "Project API keys", find your "Project URL" and the "anon" public key.
// 5. Paste them into the variables below, replacing the placeholder strings.
// =================================================================================
const supabaseUrl = 'YOUR_SUPABASE_URL'; // <-- PASTE YOUR SUPABASE URL HERE
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // <-- PASTE YOUR SUPABASE ANON KEY HERE


if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn(
`********************************************************************************
*                                                                              *
*                           CONFIGURATION REQUIRED                             *
*                                                                              *
*    Please update YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY in             *
*    services/supabaseClient.ts with your actual Supabase credentials.         *
*                                                                              *
********************************************************************************`
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/*
================================================================================
                        REQUIRED SUPABASE SETUP
================================================================================

1.  Go to your Supabase project's SQL Editor.
2.  Run the following SQL to create the 'profiles' table. This table will
    store user data, including their learning progress and API key.

    -- Create the profiles table
    CREATE TABLE public.profiles (
      id uuid NOT NULL,
      updated_at timestamp with time zone NULL,
      user_data jsonb NULL,
      gemini_api_key text NULL,
      CONSTRAINT profiles_pkey PRIMARY KEY (id),
      CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
    );

3.  Enable Row Level Security (RLS) on the 'profiles' table.
    - Go to Authentication -> Policies in your Supabase dashboard.
    - Find the 'profiles' table and click "Enable RLS".

4.  Create policies to control access to the data. Run these queries in the
    SQL Editor to allow users to manage ONLY their own profiles.

    -- Allow users to view their own profile
    CREATE POLICY "Enable read access for users based on user_id"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

    -- Allow users to update their own profile
    CREATE POLICY "Enable update for users based on user_id"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

    -- This policy is handled by the AuthContext on sign-up and is not needed
    -- CREATE POLICY "Enable insert for users based on user_id"
    -- ON public.profiles
    -- FOR INSERT
    -- WITH CHECK (auth.uid() = id);

5.  You are now set up! The application will handle creating a new profile
    row automatically whenever a new user signs up.

================================================================================
*/
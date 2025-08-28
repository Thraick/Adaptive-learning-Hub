
import { createClient } from '@supabase/supabase-js'

// These variables are populated from your environment configuration.
// See the `example.env` file for more information.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
`********************************************************************************
*                                                                              *
*                           CONFIGURATION REQUIRED                             *
*                                                                              *
*    Supabase URL or Anon Key is missing. Please make sure you have a          *
*    .env file with SUPABASE_URL and SUPABASE_ANON_KEY variables.              *
*    See example.env for reference.                                            *
*                                                                              *
********************************************************************************`
    );
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

/*
================================================================================
                        REQUIRED SUPABASE SETUP
================================================================================

1.  Go to your Supabase project's SQL Editor.
2.  Run the following SQL to create the 'profiles' table. This table will
    store user data, including their learning progress.

    -- Create the profiles table
    CREATE TABLE public.profiles (
      id uuid NOT NULL,
      updated_at timestamp with time zone NULL,
      user_data jsonb NULL,
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

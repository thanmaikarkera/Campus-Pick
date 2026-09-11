const SUPABASE_URL = "https://xjvdmzmbnuljgxfhkccy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aKiAmCkkN85s4_f-TsPHfg_d_FKGYlZ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


console.log("Supabase client connected:", supabaseClient);
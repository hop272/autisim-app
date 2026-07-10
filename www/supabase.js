// Replace these with your actual Supabase URL and Anon Key from the dashboard
const SUPABASE_URL = 'https://murrbtpubezebqwkvojc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cnJidHB1YmV6ZWJxd2t2b2pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjMzMzYsImV4cCI6MjA5OTA5OTMzNn0.3Ilug8xAdBW2_gmOJsw2q86s-bGZ8EpgGwtrzEn3EPE';
// Lazy-initialize the supabase client to avoid crashes if the CDN hasn't loaded yet
let client = null;
export const getSupabase = () => {
    if (client)
        return client;
    // @ts-ignore
    if (window.supabase) {
        // @ts-ignore
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return client;
    }
    console.error('Supabase CDN not loaded yet');
    return null;
};
// For compatibility with existing imports
export const supabase = new Proxy({}, {
    get: (target, prop) => {
        const c = getSupabase();
        if (c)
            return c[prop];
        // Return a dummy object that handles common Supabase patterns to avoid crashes
        if (prop === 'auth') {
            return {
                getSession: async () => ({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
            };
        }
        const dummyFunc = () => {
            console.error('Supabase not available');
            return {
                error: { message: 'Supabase not available' },
                data: null,
                select: () => dummyFunc(),
                from: () => dummyFunc(),
                eq: () => dummyFunc(),
                single: () => dummyFunc(),
                upsert: () => dummyFunc(),
            };
        };
        return dummyFunc;
    }
});

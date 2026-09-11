// Supabase client instance and cloud connectivity helpers

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = val =>
  !val ||
  typeof val !== 'string' ||
  val.includes('your-project') ||
  val.includes('your-public-anon-key') ||
  val.includes('placeholder') ||
  val.trim() === '';

// Only initialize Supabase if valid, non-placeholder credentials are provided.
// If not configured, ScholarHub seamlessly runs in offline local demo mode.
export const supabase =
  !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseKey) && window.supabase?.createClient
    ? window.supabase.createClient(supabaseUrl.trim(), supabaseKey.trim())
    : null;

export const cloudReady = () => {
  if (!supabase) return false;
  try {
    const user = JSON.parse(localStorage.getItem('scholarHubCurrentUser') || 'null');
    return Boolean(user?.id);
  } catch {
    return false;
  }
};

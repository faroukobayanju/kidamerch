import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase browser client.
 *
 * Both values are public by design (the anon key is safe to ship) — row level
 * security in the database is what actually protects your data, not the key.
 * Never put the service_role key in this file or any VITE_ variable.
 */
const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const anonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

/** True once both env vars are present, so the app can fall back gracefully. */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/** Storage bucket holding product photography. */
export const PRODUCT_BUCKET = "product-images";

/** Uploads a file and returns its public URL. */
export async function uploadProductImage(file: File): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

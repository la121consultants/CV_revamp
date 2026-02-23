import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./usage.ts";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Validates the Authorization header and returns the authenticated user.
 * Returns a Response (401) if authentication fails, or the user object on success.
 */
export async function requireAuth(req: Request): Promise<AuthenticatedUser | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader === "Bearer ") {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data.user || !data.user.email) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired authentication token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return { id: data.user.id, email: data.user.email };
}

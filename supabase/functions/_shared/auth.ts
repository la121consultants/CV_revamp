import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse } from "./errors.ts";

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
    return errorResponse("ERR_2003_AUTH_REQUIRED");
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data.user || !data.user.email) {
    return errorResponse("ERR_2007_INVALID_AUTH_TOKEN");
  }

  return { id: data.user.id, email: data.user.email };
}

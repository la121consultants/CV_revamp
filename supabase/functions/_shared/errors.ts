import { corsHeaders } from "./usage.ts";

export type ErrorCode =
  | "ERR_2001_USAGE_LIMIT_REACHED"
  | "ERR_2002_INVALID_REQUEST"
  | "ERR_2003_AUTH_REQUIRED"
  | "ERR_2004_RATE_LIMITED"
  | "ERR_2005_SERVICE_MISCONFIGURED"
  | "ERR_2006_UPSTREAM_FAILURE"
  | "ERR_2007_INVALID_AUTH_TOKEN"
  | "ERR_2500_INTERNAL_ERROR";

export const errorCatalog: Record<ErrorCode, { status: number; message: string; customerMessage: string }> = {
  ERR_2001_USAGE_LIMIT_REACHED: {
    status: 402,
    message: "Usage limit reached.",
    customerMessage: "You've used all free CV trials for today. Upgrade your plan or try again tomorrow.",
  },
  ERR_2002_INVALID_REQUEST: {
    status: 400,
    message: "Invalid request payload.",
    customerMessage: "Some required information is missing. Please review your inputs and try again.",
  },
  ERR_2003_AUTH_REQUIRED: {
    status: 401,
    message: "Authentication required.",
    customerMessage: "Please sign in to continue.",
  },
  ERR_2004_RATE_LIMITED: {
    status: 429,
    message: "Rate limit exceeded.",
    customerMessage: "You're making requests too quickly. Please wait a moment and try again.",
  },
  ERR_2005_SERVICE_MISCONFIGURED: {
    status: 500,
    message: "Required service configuration is missing.",
    customerMessage: "Our service is temporarily unavailable. Please try again shortly.",
  },
  ERR_2006_UPSTREAM_FAILURE: {
    status: 502,
    message: "AI provider request failed.",
    customerMessage: "We couldn't complete your request due to a temporary AI service issue. Please try again.",
  },
  ERR_2007_INVALID_AUTH_TOKEN: {
    status: 401,
    message: "Invalid or expired authentication token.",
    customerMessage: "Your session has expired. Please sign in again.",
  },
  ERR_2500_INTERNAL_ERROR: {
    status: 500,
    message: "Unexpected server error.",
    customerMessage: "Something went wrong on our side. Please try again.",
  },
};

export const errorResponse = (code: ErrorCode, overrideMessage?: string, overrideStatus?: number) => {
  const entry = errorCatalog[code];
  return new Response(
    JSON.stringify({
      error: overrideMessage ?? entry.message,
      code,
      customerMessage: entry.customerMessage,
    }),
    {
      status: overrideStatus ?? entry.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
};

export type AppErrorCode =
  | "ERR_2001_USAGE_LIMIT_REACHED"
  | "ERR_2002_INVALID_REQUEST"
  | "ERR_2003_AUTH_REQUIRED"
  | "ERR_2004_RATE_LIMITED"
  | "ERR_2005_SERVICE_MISCONFIGURED"
  | "ERR_2006_UPSTREAM_FAILURE"
  | "ERR_2007_INVALID_AUTH_TOKEN"
  | "ERR_2500_INTERNAL_ERROR"
  | "UNKNOWN_ERROR";

export type ErrorCatalogEntry = {
  code: AppErrorCode;
  httpStatus: number;
  message: string;
  customerMessage: string;
};

export const ERROR_CATALOG: Record<AppErrorCode, ErrorCatalogEntry> = {
  ERR_2001_USAGE_LIMIT_REACHED: {
    code: "ERR_2001_USAGE_LIMIT_REACHED",
    httpStatus: 402,
    message: "Usage limit reached.",
    customerMessage: "You've used all free CV trials for today. Upgrade your plan or try again tomorrow.",
  },
  ERR_2002_INVALID_REQUEST: {
    code: "ERR_2002_INVALID_REQUEST",
    httpStatus: 400,
    message: "Invalid request payload.",
    customerMessage: "Some required information is missing. Please review your details and try again.",
  },
  ERR_2003_AUTH_REQUIRED: {
    code: "ERR_2003_AUTH_REQUIRED",
    httpStatus: 401,
    message: "Authentication required.",
    customerMessage: "Please sign in to continue.",
  },
  ERR_2004_RATE_LIMITED: {
    code: "ERR_2004_RATE_LIMITED",
    httpStatus: 429,
    message: "Rate limit exceeded.",
    customerMessage: "You're making requests too quickly. Please wait a moment and try again.",
  },
  ERR_2005_SERVICE_MISCONFIGURED: {
    code: "ERR_2005_SERVICE_MISCONFIGURED",
    httpStatus: 500,
    message: "Required service configuration is missing.",
    customerMessage: "Our service is temporarily unavailable. Please try again shortly.",
  },
  ERR_2006_UPSTREAM_FAILURE: {
    code: "ERR_2006_UPSTREAM_FAILURE",
    httpStatus: 502,
    message: "AI provider request failed.",
    customerMessage: "We couldn't complete your request due to a temporary AI service issue. Please try again.",
  },
  ERR_2007_INVALID_AUTH_TOKEN: {
    code: "ERR_2007_INVALID_AUTH_TOKEN",
    httpStatus: 401,
    message: "Invalid or expired authentication token.",
    customerMessage: "Your session has expired. Please sign in again.",
  },
  ERR_2500_INTERNAL_ERROR: {
    code: "ERR_2500_INTERNAL_ERROR",
    httpStatus: 500,
    message: "Unexpected server error.",
    customerMessage: "Something went wrong on our side. Please try again.",
  },
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    httpStatus: 500,
    message: "Unknown error.",
    customerMessage: "Something went wrong. Please try again.",
  },
};

export type ParsedAppError = {
  code: AppErrorCode;
  customerMessage: string;
  technicalMessage?: string;
  status?: number;
};

export const parseFunctionError = async (error: any): Promise<ParsedAppError> => {
  const fallback = ERROR_CATALOG.UNKNOWN_ERROR;

  let body: any = null;
  try {
    if (error?.context && typeof error.context.clone === "function") {
      body = await error.context.clone().json();
    } else if (error?.context && typeof error.context.json === "function") {
      body = await error.context.json();
    }
  } catch {
    body = null;
  }

  const code = (body?.code as AppErrorCode) || "UNKNOWN_ERROR";
  const entry = ERROR_CATALOG[code] || fallback;

  const fallbackMessage = typeof error?.message === "string" && error.message.trim()
    ? error.message
    : entry.customerMessage;

  return {
    code,
    customerMessage: body?.customerMessage || fallbackMessage,
    technicalMessage: body?.error || error?.message,
    status: error?.context?.status,
  };
};

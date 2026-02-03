const SESSION_KEY = "cv-revamp-session-id";

export const getSessionId = () => {
  if (typeof window === "undefined") return "server-session";
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
};

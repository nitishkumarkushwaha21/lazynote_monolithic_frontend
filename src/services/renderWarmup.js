const WARMUP_SESSION_KEY = "algonote-render-warmup:v1";
const WARMUP_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 12000;

let hasWarmedUpInMemory = false;

const isBrowser = typeof window !== "undefined";

const resolveHealthUrl = () => {
  const envApiBaseUrl = String(import.meta.env.VITE_API_URL || "").trim();
  if (envApiBaseUrl) {
    try {
      const parsed = new URL(envApiBaseUrl);
      return `${parsed.origin}/health`;
    } catch (_error) {
      if (import.meta.env.DEV) {
        console.warn("[renderWarmup] Invalid VITE_API_URL; skipping warmup.");
      }
      return null;
    }
  }

  if (!isBrowser) {
    return null;
  }

  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:5000/health`;
  }

  return "/health";
};

const wasWarmupAlreadyAttempted = () => {
  if (!isBrowser) {
    return hasWarmedUpInMemory;
  }

  if (hasWarmedUpInMemory) {
    return true;
  }

  return window.sessionStorage.getItem(WARMUP_SESSION_KEY) === "true";
};

const markWarmupAttempted = () => {
  hasWarmedUpInMemory = true;
  if (!isBrowser) {
    return;
  }

  window.sessionStorage.setItem(WARMUP_SESSION_KEY, "true");
};

const pingHealth = async (url, timeoutMs) => {
  if (!url || !isBrowser) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
    });
    return response.ok;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug("[renderWarmup] Warmup request failed.", error);
    }
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const triggerRenderWarmup = () => {
  if (!isBrowser || wasWarmupAlreadyAttempted()) {
    return;
  }

  const healthUrl = resolveHealthUrl();
  if (!healthUrl) {
    return;
  }

  markWarmupAttempted();

  void pingHealth(healthUrl, WARMUP_TIMEOUT_MS).then((ok) => {
    if (ok) {
      return;
    }

    window.setTimeout(() => {
      void pingHealth(healthUrl, WARMUP_TIMEOUT_MS);
    }, RETRY_DELAY_MS);
  });
};

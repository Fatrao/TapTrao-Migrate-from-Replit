import { QueryClient, QueryFunction, MutationCache } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

/** Default timeout for API requests (30 seconds) */
const API_TIMEOUT_MS = 30_000;

/**
 * Maps raw HTTP status codes and network errors to user-friendly messages.
 */
function friendlyMessage(status: number, raw: string): string {
  if (raw.includes("Failed to fetch") || raw.includes("NetworkError") || raw.includes("ERR_INTERNET_DISCONNECTED")) {
    return "Unable to reach the server. Please check your internet connection and try again.";
  }
  if (raw.includes("The operation was aborted") || raw.includes("AbortError") || raw.includes("signal is aborted")) {
    return "The request took too long. Please try again.";
  }

  switch (status) {
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 408:
      return "The request timed out. Please try again.";
    case 413:
      return "The uploaded file is too large.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Something went wrong on our end. Please try again shortly.";
    case 502:
      return "Server is restarting — please try again in a moment.";
    case 503:
      return "Service is temporarily unavailable. Please try again shortly.";
    case 504:
      return "The server took too long to respond. Please try again.";
    default:
      return raw;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        message = json.message || json.error || JSON.stringify(json);
      } else {
        const text = await res.text();
        // If it looks like HTML (e.g. Cloudflare 502 error page), show a friendly message
        if (text.startsWith("<!") || text.startsWith("<html") || text.includes("<!DOCTYPE")) {
          message = friendlyMessage(res.status, "");
        } else {
          message = text.substring(0, 200) || res.statusText;
        }
      }
    } catch {
      // If parsing fails, use statusText
    }
    // Apply friendly message mapping
    const friendly = friendlyMessage(res.status, message);
    throw new Error(`${res.status}: ${friendly}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    // Convert AbortError to a friendly timeout message
    if (error.name === "AbortError") {
      throw new Error("408: The request took too long. Please try again.");
    }
    // Convert network errors to friendly messages
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("0: Unable to reach the server. Please check your internet connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Determines whether a failed query should be retried.
 * Retries transient errors (network failures, 5xx) up to 2 times.
 * Never retries client errors (4xx) since those won't resolve on retry.
 */
function shouldRetry(failureCount: number, error: Error): boolean {
  if (failureCount >= 2) return false;

  const msg = error.message || "";
  // Extract status code from "STATUS: message" format
  const statusMatch = msg.match(/^(\d+):/);
  const status = statusMatch ? parseInt(statusMatch[1], 10) : 0;

  // Retry on network errors (status 0) and server errors (5xx)
  if (status === 0 || (status >= 500 && status <= 599)) return true;

  // Retry on timeout
  if (status === 408) return true;

  // Don't retry client errors (4xx)
  return false;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    // If React Query passes a signal (e.g. on unmount), forward abort
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        signal: controller.signal,
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("408: The request took too long. Please try again.");
      }
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("0: Unable to reach the server. Please check your internet connection and try again.");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

/**
 * Global mutation error handler — shows a toast for any mutation
 * failure that isn't already handled by the calling code.
 * Skips 402 (insufficient tokens) since pages handle that with a modal.
 */
const mutationCache = new MutationCache({
  onError: (error: Error) => {
    const msg = error.message || "";

    // 402 is handled by individual pages with the token modal
    if (msg.startsWith("402:")) return;

    // Strip the status code prefix for display
    const display = msg.replace(/^\d+:\s*/, "");

    toast({
      variant: "destructive",
      title: "Something went wrong",
      description: display || "An unexpected error occurred. Please try again.",
    });
  },
});

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: shouldRetry,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    mutations: {
      retry: false,
    },
  },
});

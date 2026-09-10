import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getMockResponse } from "./mockApi";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok && (res.status === 404 || res.status === 500)) {
      const mock = getMockResponse(url, method);
      if (mock !== null) {
        return new Response(JSON.stringify(mock), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    await throwIfResNotOk(res);
    return res;
  } catch (err) {
    const mock = getMockResponse(url, method);
    if (mock !== null) {
      return new Response(JSON.stringify(mock), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw err;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;

    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      if (!res.ok && (res.status === 404 || res.status === 500)) {
        const mock = getMockResponse(url);
        if (mock !== null) return mock as T;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (err) {
      const mock = getMockResponse(url);
      if (mock !== null) return mock as T;
      throw err;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});


import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useErrorReporter() {
  const debounceRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const reportError = async (message: string, source?: string, stack?: string) => {
      // Debounce: don't report same error within 10s
      const key = `${message}:${source}`;
      const now = Date.now();
      const last = debounceRef.current.get(key);
      if (last && now - last < 10000) return;
      debounceRef.current.set(key, now);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("audit_logs").insert({
          user_id: user?.id || null,
          action: "RUNTIME_ERROR",
          table_name: "system",
          record_id: source || window.location.pathname,
          new_data: {
            message,
            source,
            stack: stack?.substring(0, 2000),
            url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          } as any,
        });
      } catch {
        // Silent fail - don't create error loops
      }
    };

    const onError = (event: ErrorEvent) => {
      reportError(event.message, event.filename, event.error?.stack);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason);
      reportError(msg, "unhandled_promise", event.reason?.stack);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);
}

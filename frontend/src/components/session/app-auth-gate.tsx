"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { LoginGate } from "@/components/session/login-gate";
import {
  AUTH_SESSION_INVALID_EVENT,
  clearStoredAuthToken,
  getCurrentAccount,
  getStoredAuthToken,
} from "@/lib/api";

interface AppAuthGateProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = new Set(["/login", "/privacy", "/terms", "/community", "/accessibility"]);

export function AppAuthGate({ children }: AppAuthGateProps) {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<"checking" | "authenticated" | "anonymous">("checking");

  useEffect(() => {
    let active = true;

    async function verifyToken() {
      const token = getStoredAuthToken();
      if (!token) {
        setAuthState("anonymous");
        return;
      }

      try {
        await getCurrentAccount(token);
        if (active) {
          setAuthState("authenticated");
        }
      } catch {
        clearStoredAuthToken();
        if (active) {
          setAuthState("anonymous");
        }
      }
    }

    void verifyToken();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleInvalidSession = () => setAuthState("anonymous");
    window.addEventListener(AUTH_SESSION_INVALID_EVENT, handleInvalidSession);
    return () => {
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, handleInvalidSession);
    };
  }, []);

  const handleSessionChange = () => {
    setAuthState("authenticated");
  };

  if (PUBLIC_ROUTES.has(pathname)) {
    return children;
  }

  if (authState !== "authenticated") {
    return <LoginGate loading={authState === "checking"} onSessionChange={handleSessionChange} />;
  }

  return children;
}

"use client";

import { useRouter } from "next/navigation";

import { LoginGate } from "@/components/session/login-gate";

export default function LoginPage() {
  const router = useRouter();

  const handleSessionChange = () => {
    router.replace("/session");
  };

  return <LoginGate onSessionChange={handleSessionChange} />;
}

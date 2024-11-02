"use client";

import { useChromia } from "@/lib/chromia-connect/chromia-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import GameLayout from "./game-layout";

export default function GamePage() {
  const { authStatus } = useChromia();
  const router = useRouter();
  
  useEffect(() => {
    if (authStatus !== "connected") {
      router.push("/");
    }
  }, [authStatus, router]);

  if (authStatus !== "connected") {
    return null;
  }

  return <GameLayout />;
} 
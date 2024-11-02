"use client";

import { AuthButtons } from "@/components/auth/auth-buttons";
import { useChromia } from "@/lib/chromia-connect/chromia-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { authStatus } = useChromia();
  const router = useRouter();
  
  useEffect(() => {
    if (authStatus === "connected") {
      router.push("/game");
    }
  }, [authStatus, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-3xl w-full text-center space-y-12">
        <div className="space-y-6">
          <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
            Fishing Demo
          </h1>
          <p className="text-2xl text-blue-200">
            Connect your wallet to start your adventure in the blockchain ocean!
          </p>
        </div>
        <div className="flex justify-center">
          <AuthButtons />
        </div>
      </div>
    </main>
  );
}

"use client";

import { ConnectKitButton } from "connectkit";
import { Fish, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/chromia-connect/hooks/use-auth";

const mainButtonStyles = `
  transform transition-all duration-300 ease-in-out 
  hover:scale-105 hover:shadow-[0_0_30px_rgba(56,189,248,0.5)]
  text-4xl py-12 px-20 
  bg-gradient-to-r from-emerald-400 to-cyan-400 
  hover:from-emerald-300 hover:to-cyan-300
  rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.3)]
  font-bold tracking-wide
  border-2 border-cyan-300/20
`;

const secondaryButtonStyles = `
  transform transition-all duration-200 ease-in-out 
  hover:scale-105 shadow-lg
  bg-gradient-to-r from-rose-500 to-pink-500
  hover:from-rose-400 hover:to-pink-400
  text-white font-medium
  rounded-lg
`;

const User = ({ username, onLogout, isHeader }: { 
  username: string; 
  onLogout: () => void;
  isHeader?: boolean;
}) => (
  <Button 
    variant="destructive"
    className={cn(
      secondaryButtonStyles, 
      "flex items-center space-x-2"
    )}
    onClick={onLogout}
  >
    <span>{username}</span>
    <LogOut className="w-4 h-4" />
  </Button>
);

export function AuthButtons({ isHeader = false }: { isHeader?: boolean }) {
  const { authStatus, handleConnect, handleAuthenticate, handleLogout } = useAuth();
  const router = useRouter();

  const onLogout = () => {
    handleLogout();
    router.push("/");
  };

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        if (!isConnected) {
          return (
            <Button
              className={cn(
                mainButtonStyles, 
                "flex items-center space-x-4"
              )}
              onClick={() => {
                handleConnect();
                show?.();
              }}
            >
              <Fish className={isHeader ? "w-6 h-6" : "w-12 h-12"} />
              <span>Connect Wallet</span>
            </Button>
          );
        }

        const username = ensName ?? truncatedAddress;

        if (authStatus === "connected") {
          return (
            <div className="hidden sm:flex items-center gap-6 pl-6">
              <div className="h-full w-px bg-blue-800/30" />
              <User username={username ?? ""} onLogout={onLogout} isHeader={isHeader} />
            </div>
          );
        }

        return (
          <div className="flex flex-col items-center space-y-8">
            {authStatus !== "notRegistered" && (
              <Button
                className={cn(
                  mainButtonStyles, 
                  "flex items-center space-x-4"
                )}
                onClick={handleAuthenticate}
              >
                <Fish className={isHeader ? "w-6 h-6" : "w-12 h-12"} />
                <span>Authenticate</span>
              </Button>
            )}
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-200">Want to use a different wallet?</span>
              <User username={username ?? ""} onLogout={onLogout} isHeader={isHeader} />
            </div>
          </div>
        );
      }}
    </ConnectKitButton.Custom>
  );
} 
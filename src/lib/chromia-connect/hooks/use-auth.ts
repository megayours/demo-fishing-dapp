"use client";

import { useChromia } from "../chromia-context";
import { useDisconnect } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const { authStatus, connectToChromia, disconnectFromChromia, isLoading } = useChromia();
  const { disconnect } = useDisconnect();
  const queryClient = useQueryClient();

  const handleConnect = () => {
    queryClient.invalidateQueries();
  };

  const handleAuthenticate = () => {
    connectToChromia();
  };

  const handleLogout = async () => {
    disconnect(undefined, {
      onSettled: () => {
        disconnectFromChromia();
        queryClient.invalidateQueries();
        sessionStorage.removeItem("FT_LOGIN_KEY_STORE");
      },
    });
  };

  return {
    authStatus,
    isLoading,
    handleConnect,
    handleAuthenticate,
    handleLogout
  };
} 
import { NetworkSettings } from "postchain-client";

export type ChromiaConfig = NetworkSettings;

export type AuthComponentProps = {
  username?: string;
  isConnected: boolean;
  isLoading: boolean;
  onConnect: () => void;
  onAuthenticate: () => void;
  onLogout: () => void;
};

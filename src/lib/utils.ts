import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertIpfsToGatewayUrl = (ipfsUrl: string): string => {
  if (!ipfsUrl.startsWith('ipfs://')) return ipfsUrl;
  return `https://ipfs.io/ipfs/${ipfsUrl.replace('ipfs://', '')}`;
};
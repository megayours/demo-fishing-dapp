import { type Chain } from 'viem';

export const polygonAmoy: Chain = {
  id: 80_002,
  name: 'Polygon Amoy',
  nativeCurrency: {
    decimals: 18,
    name: 'POL',
    symbol: 'POL',
  },
  rpcUrls: {
    default: { http: ['https://polygon-amoy-bor-rpc.publicnode.com'] },
    public: { http: ['https://polygon-amoy-bor-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com/' },
  },
  testnet: true,
};

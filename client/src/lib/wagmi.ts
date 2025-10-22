import { http, createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// Supported chains for Drosera monitoring
export const supportedChains = [mainnet, polygon, arbitrum, optimism, base] as const;

// Create wagmi config
export const config = createConfig({
  chains: supportedChains,
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'drosera-studio-default',
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
});

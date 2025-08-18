import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { WagmiConfig, createConfig, configureChains, mainnet, sepolia } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { polygon, polygonMumbai } from 'wagmi/chains';

const { chains, publicClient } = configureChains(
    [mainnet, sepolia, polygon, polygonMumbai],
    [publicProvider()]
);

const config = createConfig({
    autoConnect: false,
    publicClient,
    connectors: [
        new InjectedConnector({ chains }),
        // Optional: Add WalletConnect
        // new WalletConnectConnector({ chains, options: { projectId: 'YOUR_WALLETCONNECT_PROJECT_ID' } }),
    ],
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <WagmiConfig config={config}>
            <App />
        </WagmiConfig>
    </StrictMode>
);

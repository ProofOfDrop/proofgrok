import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygon, polygonMumbai } from 'wagmi/chains';
import { injected } from '@wagmi/connectors';

const config = createConfig({
    chains: [mainnet, sepolia, polygon, polygonMumbai],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [polygon.id]: http(),
        [polygonMumbai.id]: http(),
    },
    connectors: [
        injected(),
    ],
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <WagmiProvider config={config}>
            <App />
        </WagmiProvider>
    </StrictMode>
);

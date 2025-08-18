import { useState } from 'react';
import { useAccount, useConnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import './index.css';

function App() {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect({
        connector: new InjectedConnector(),
        // Optional: Add WalletConnect for mobile users
        // connector: new WalletConnectConnector({ options: { projectId: 'YOUR_WALLETCONNECT_PROJECT_ID' } }),
    });
    const { chain } = useNetwork();
    const { switchNetwork } = useSwitchNetwork();
    const [scores, setScores] = useState({
        walletAge: 0, gasSpent: 0, uniqueContracts: 0, governance: 0, defi: 0, airdrops: 0,
    });
    const [totalScore, setTotalScore] = useState(0);
    const [badge, setBadge] = useState('');
    const [isScoreVisible, setIsScoreVisible] = useState(false);

    const networkConfigs = {
        1: { name: 'Ethereum Mainnet', covalentChain: 'eth-mainnet', moralisChain: 'eth' },
        11155111: { name: 'Sepolia', covalentChain: 'eth-sepolia', moralisChain: 'sepolia' },
        137: { name: 'Polygon Mainnet', covalentChain: 'polygon-mainnet', moralisChain: 'polygon' },
        80001: { name: 'Polygon Mumbai', covalentChain: 'polygon-mumbai', moralisChain: 'mumbai' },
    };

    const COVALENT_API_KEY = 'cqt_rQYkGgFvK3CcfjKw9K4gGBQmxyRK'; // Replace with your key
    const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjQwMDhkMTc4LWQxNmItNDU4Yy05MTRkLWNlZjU1YzZmMjdiMyIsIm9yZ0lkIjoiNDY0MzAyIiwidXNlcklkIjoiNDc3NjY3IiwidHlwZUlkIjoiYTNhODc2MmUtYWRiNS00MDk1LWFmNmEtNDhmNGQ5ZTA4NDVkIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTQ4MTI3MjQsImV4cCI6NDkxMDU3MjcyNH0.ssV3d1p5s7iDcYT2rZtosJ8J_z1cuuNvF9bU5X8O2HY'; // Replace with your key

    const calculateScore = async () => {
        try {
            const config = networkConfigs[chain?.id] || networkConfigs[1];
            let newScores = {
                walletAge: 0, gasSpent: 0, uniqueContracts: 0, governance: 0, defi: 0, airdrops: 0,
            };

            // Fetch transactions (Covalent)
            const covalentTxs = await fetch(
                `https://api.covalenthq.com/v1/${config.covalentChain}/address/${address}/transactions_v2/?key=${COVALENT_API_KEY}`
            ).then(res => res.json()).then(data => data.data?.items || []);

            // Fetch token transfers (Moralis)
            const moralisTransfers = await fetch(
                `https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=${config.moralisChain}`,
                { headers: { 'X-API-Key': MORALIS_API_KEY } }
            ).then(res => res.json()).then(data => data.result || []);

            // Wallet Age (10 pts)
            const firstTx = covalentTxs.length > 0 ? new Date(covalentTxs[0].block_signed_at) : new Date();
            const monthsSinceFirst = (new Date() - firstTx) / (1000 * 60 * 60 * 24 * 30);
            newScores.walletAge = Math.min(Math.floor(monthsSinceFirst), 10);

            // Gas Spent (10 pts)
            let totalGas = 0;
            for (const tx of covalentTxs) {
                totalGas += parseFloat(tx.gas_price * tx.gas_spent) / 1e18; // Wei to ETH/MATIC
            }
            newScores.gasSpent = Math.min(Math.floor(totalGas * 10), 10);

            // Unique Contract Interactions (20 pts)
            const contracts = new Set(covalentTxs.map(tx => tx.to_address).filter(to => to && /^0x[a-fA-F0-9]{40}$/.test(to)));
            newScores.uniqueContracts = Math.min(contracts.size, 20);

            // Governance Participation (20 pts)
            const governanceContracts = ['0x323a76393544d5ecca80cd6ef2a560c6a395b7e3', '0x5e4be8bc9637f0eaa1a755019e31c0020aa'];
            newScores.governance = Math.min(
                covalentTxs.filter(tx => governanceContracts.includes(tx.to_address?.toLowerCase())).length * 2,
                20
            );

            // DeFi Engagement (20 pts)
            const defiContracts = ['0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'];
            newScores.defi = Math.min(
                covalentTxs.filter(tx => defiContracts.includes(tx.to_address?.toLowerCase())).length * 2,
                20
            );

            // Airdrops Claimed (20 pts)
            newScores.airdrops = Math.min(moralisTransfers.length, 20);

            // Calculate total and badge
            const total = Object.values(newScores).reduce((sum, val) => sum + val, 0);
            let newBadge = '';
            if (total >= 80) newBadge = 'Human';
            else if (total >= 60) newBadge = 'Cyborg';
            else if (total >= 40) newBadge = 'Humanoid';
            else if (total >= 20) newBadge = 'Sybil';
            else newBadge = 'Sybil';

            setScores(newScores);
            setTotalScore(total);
            setBadge(newBadge);
            setIsScoreVisible(true);
        } catch (error) {
            console.error('Error calculating score:', error);
            alert('Error fetching data. Try another network or wallet.');
        }
    };

    return (
        <div className="min-h-screen text-white hero-bg">
            {/* Header */}
            <header className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-3xl font-bold">ProofDrop</h1>
                    <button
                        onClick={() => connect()}
                        className={`${
                            isConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                        } text-white font-semibold py-2 px-4 rounded-lg transition`}
                    >
                        {isConnected ? 'Connected' : 'Connect Wallet'}
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl sm:text-5xl font-extrabold">Your Airdrop Reputation Score</h2>
                <p className="mt-4 text-lg text-gray-300">Prove you're a legit crypto user. Connect your wallet to see your score.</p>
                <div className="mt-8">
                    <select
                        onChange={(e) => switchNetwork?.(parseInt(e.target.value))}
                        className="bg-gray-800 text-white p-2 rounded-lg"
                    >
                        {Object.entries(networkConfigs).map(([id, { name }]) => (
                            <option key={id} value={id}>{name}</option>
                        ))}
                    </select>
                </div>
                {isConnected && (
                    <div className="mt-6 text-lg">
                        <p>Connected Wallet: <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span></p>
                        <button
                            onClick={calculateScore}
                            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                        >
                            Mint Your Score/Humanity
                        </button>
                    </div>
                )}
            </section>

            {/* Score Display */}
            {isScoreVisible && (
                <section className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <h3 className="text-2xl font-bold mb-6">Your Reputation Score</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(scores).map(([key, value]) => (
                            <div key={key} className="bg-gray-800 p-6 rounded-lg">
                                <h4 className="text-lg font-semibold">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <p>{value} / {key === 'walletAge' || key === 'gasSpent' ? 10 : 20}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 text-3xl font-bold">
                        Total Score: {totalScore} / 100
                    </div>
                    <div className={`mt-4 p-4 rounded-lg text-xl font-bold badge-${badge.toLowerCase()}`}>
                        Your Badge: {badge}
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-800 text-center">
                <p className="text-gray-400">&copy; 2025 ProofDrop. Built for the crypto community.</p>
            </footer>
        </div>
    );
}

export default App;

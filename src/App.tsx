import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BrowserPanel } from './components/BrowserPanel';
import { ConsolePanel } from './components/ConsolePanel';
import { ExploreGallery } from './components/ExploreGallery';
import { NetworkConfig, AccountInfo, ProviderLog } from './types';
import { NETWORKS, generateTestKeypair, fetchAccountBalance } from './services/stellar';

export const App: React.FC = () => {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkConfig>(NETWORKS.local);
  const [activeView, setActiveView] = useState<'workspace' | 'explore'>('workspace');
  const [galleryUrl, setGalleryUrl] = useState<string>();
  const [galleryLaunchKey, setGalleryLaunchKey] = useState(0);
  
  // Default pre-seeded test keypairs
  const [accounts, setAccounts] = useState<AccountInfo[]>([
    {
      name: 'Alice (Primary Tester)',
      publicKey: 'GA7Q3F6K4O3Q2N5M8L9K1J2H3G4F5E6D7C8B9A01',
      secretKey: 'SD12345678901234567890123456789012345678901234567890',
    },
    {
      name: 'Bob (Secondary Tester)',
      publicKey: 'GBRPYHIL2CI3FNQ4BXLFMNDLFPPPU2HY44TOE355KCXAZUOWVYOO4ZF',
      secretKey: 'SD98765432109876543210987654321098765432109876543210',
    },
  ]);

  const [activeAccount, setActiveAccount] = useState<AccountInfo>(accounts[0]);
  const [accountBalance, setAccountBalance] = useState<string>('Checking...');
  const [providerLogs, setProviderLogs] = useState<ProviderLog[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString(),
      method: 'isConnected',
      result: true,
    },
    {
      id: '2',
      timestamp: new Date().toLocaleTimeString(),
      method: 'getPublicKey',
      result: accounts[0].publicKey,
    },
  ]);

  // Refresh balance when network or account changes
  const updateBalance = async () => {
    setAccountBalance('Refreshing...');
    const bal = await fetchAccountBalance(currentNetwork, activeAccount.publicKey);
    setAccountBalance(bal);
  };

  useEffect(() => {
    updateBalance();
  }, [currentNetwork, activeAccount]);

  const handleAddAccount = () => {
    const pair = generateTestKeypair();
    const newAcc: AccountInfo = {
      name: `Test Account #${accounts.length + 1}`,
      publicKey: pair.publicKey,
      secretKey: pair.secretKey,
    };
    setAccounts((prev) => [...prev, newAcc]);
    setActiveAccount(newAcc);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <Header
        currentNetwork={currentNetwork}
        onSelectNetwork={setCurrentNetwork}
        accounts={accounts}
        activeAccount={activeAccount}
        onSelectAccount={setActiveAccount}
        onAddAccount={handleAddAccount}
        accountBalance={accountBalance}
        onRefreshBalance={updateBalance}
      />

      <nav aria-label="Main navigation" className="flex items-center gap-1 border-b-2 border-black bg-slate-100 px-4 py-2">
        <button onClick={() => setActiveView('workspace')} className={`rounded border-2 border-black px-4 py-1.5 text-xs font-black uppercase ${activeView === 'workspace' ? 'bg-black text-white' : 'bg-white hover:bg-slate-200'}`}>Workspace</button>
        <button onClick={() => setActiveView('explore')} className={`rounded border-2 border-black px-4 py-1.5 text-xs font-black uppercase ${activeView === 'explore' ? 'bg-black text-white' : 'bg-white hover:bg-slate-200'}`}>Explore apps</button>
      </nav>

      {activeView === 'explore' ? (
        <ExploreGallery onTryProject={(url) => { setGalleryUrl(url); setGalleryLaunchKey((key) => key + 1); setActiveView('workspace'); }} />
      ) : (
        /* Main Split-Screen Workspace */
        <main className="flex-1 p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[calc(100vh-120px)]">
          <div className="lg:col-span-7 min-h-[60vh] lg:min-h-0">
            <BrowserPanel currentNetwork={currentNetwork} activeAccount={activeAccount} initialUrl={galleryUrl} launchKey={galleryLaunchKey} />
          </div>
          <div className="lg:col-span-5 min-h-[60vh] lg:min-h-0">
            <ConsolePanel currentNetwork={currentNetwork} providerLogs={providerLogs} />
          </div>
        </main>
      )}
    </div>
  );
};

export default App;

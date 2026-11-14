import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { BrowserPanel } from './components/BrowserPanel';
import { ConsolePanel } from './components/ConsolePanel';
import { ExploreGallery } from './components/ExploreGallery';
import { ResizeHandle } from './components/ResizeHandle';
import { NetworkConfig, AccountInfo, ProviderLog } from './types';
import { NETWORKS, generateTestKeypair, fetchAccountBalance } from './services/stellar';

const SPLIT_STORAGE_KEY = 'sorocrew_studio_split_pct';
const DEFAULT_SPLIT_PCT = 58.33; // Matches original 7/12 : 5/12 desktop ratio
const MIN_SPLIT_PCT = 30;
const MAX_SPLIT_PCT = 70;

function clampSplit(value: number): number {
  return Math.min(MAX_SPLIT_PCT, Math.max(MIN_SPLIT_PCT, value));
}

function loadSavedSplit(): number {
  try {
    const raw = window.localStorage.getItem(SPLIT_STORAGE_KEY);
    if (!raw) return DEFAULT_SPLIT_PCT;
    const parsed = parseFloat(raw);
    if (Number.isFinite(parsed)) {
      return clampSplit(parsed);
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
  return DEFAULT_SPLIT_PCT;
}

export const App: React.FC = () => {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkConfig>(NETWORKS.local);
  const [activeView, setActiveView] = useState<'workspace' | 'explore'>('workspace');
  const [galleryUrl, setGalleryUrl] = useState<string>();
  const [galleryLaunchKey, setGalleryLaunchKey] = useState(0);
  const [splitPercent, setSplitPercent] = useState<number>(() => loadSavedSplit());
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const workspaceRef = useRef<HTMLElement | null>(null);

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
  const [providerLogs] = useState<ProviderLog[]>([
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

  // Persist split percentage to localStorage whenever it changes
  useEffect(() => {
    try {
      window.localStorage.setItem(SPLIT_STORAGE_KEY, splitPercent.toFixed(2));
    } catch {
      // Ignore storage write errors
    }
  }, [splitPercent]);

  // Handle mouse drag for split-pane resizing
  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = workspaceRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const relativeX = e.clientX - rect.left;
      const nextPercent = clampSplit((relativeX / rect.width) * 100);
      setSplitPercent(nextPercent);
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit]);

  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  }, []);

  const handleStepResize = useCallback((deltaPercent: number) => {
    setSplitPercent((prev) => clampSplit(prev + deltaPercent));
  }, []);

  const handleResetSplit = useCallback(() => {
    setSplitPercent(DEFAULT_SPLIT_PCT);
  }, []);

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
        /* Main Resizable Split-Screen Workspace (stacks vertically on mobile, horizontal split on lg+) */
        <main
          ref={workspaceRef}
          style={{ '--left-panel-width': `${splitPercent}%` } as React.CSSProperties}
          className={`flex-1 p-3 flex flex-col lg:flex-row gap-3 lg:gap-0 min-h-[calc(100vh-120px)] ${
            isDraggingSplit ? 'cursor-col-resize select-none' : ''
          }`}
        >
          <div className={`w-full lg:w-[var(--left-panel-width)] min-h-[60vh] lg:min-h-0 shrink-0 ${isDraggingSplit ? 'pointer-events-none' : ''}`}>
            <BrowserPanel currentNetwork={currentNetwork} activeAccount={activeAccount} initialUrl={galleryUrl} launchKey={galleryLaunchKey} />
          </div>

          <ResizeHandle
            splitPercent={splitPercent}
            minPercent={MIN_SPLIT_PCT}
            maxPercent={MAX_SPLIT_PCT}
            isDragging={isDraggingSplit}
            onDragStart={handleDragStart}
            onStepResize={handleStepResize}
            onReset={handleResetSplit}
          />

          <div className={`w-full lg:flex-1 min-w-0 min-h-[60vh] lg:min-h-0 ${isDraggingSplit ? 'pointer-events-none' : ''}`}>
            <ConsolePanel currentNetwork={currentNetwork} providerLogs={providerLogs} />
          </div>
        </main>
      )}
    </div>
  );
};

export default App;

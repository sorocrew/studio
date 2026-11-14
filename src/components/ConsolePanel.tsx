import React, { useState, useEffect } from 'react';
import {
  NetworkConfig,
  HorizonLedger,
  SorobanEvent,
  DecodedXDR,
  ProviderLog,
  ContractStorageSnapshot,
  StorageDurabilityTier,
} from '../types';
import {
  fetchLatestLedgers,
  decodeXDRString,
  fetchLiveSorobanEvents,
  simulateSorobanContract,
} from '../services/stellar';
import { fetchContractStorage } from '../services/contractStorage';
import {
  Layers,
  Activity,
  FileCode,
  Play,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  Search,
  ArrowRight,
  Database,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface ConsolePanelProps {
  currentNetwork: NetworkConfig;
  providerLogs: ProviderLog[];
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ currentNetwork, providerLogs }) => {
  const [activeTab, setActiveTab] = useState<
    'ledgers' | 'events' | 'xdr' | 'interactor' | 'storage' | 'logs'
  >('ledgers');
  const [ledgers, setLedgers] = useState<HorizonLedger[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState<boolean>(false);

  // Soroban Events State
  const [events, setEvents] = useState<SorobanEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);

  // XDR Inspector State
  const [xdrInput, setXdrInput] = useState<string>(
    'AAAAAgAAAAA4... (Paste raw XDR payload string here)'
  );
  const [xdrResult, setXdrResult] = useState<DecodedXDR | null>(null);
  const [xdrError, setXdrError] = useState<string | null>(null);

  // Contract Interactor State
  // Real Soroban Testnet Native SAC (Stellar Asset Contract) address or test contract
  const [contractId, setContractId] = useState<string>(
    'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
  );
  const [functionName, setFunctionName] = useState<string>('balance');
  const [argsJson, setArgsJson] = useState<string>(
    '["GBRPYHIL2CI3FNQ4BXLFMNDLFPPPU2HY44TOE355KCXAZUOWVYOO4ZF"]'
  );
  const [contractResult, setContractResult] = useState<string | null>(null);
  const [invoking, setInvoking] = useState<boolean>(false);
  const [lastSimulationXdr, setLastSimulationXdr] = useState<string | null>(null);

  // Contract Storage Explorer State
  const [storageContractId, setStorageContractId] = useState<string>(
    'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
  );
  const [storageProbeKeys, setStorageProbeKeys] = useState<string>(
    'Admin, ADMIN, TotalSupply, Metadata, Config'
  );
  const [storageTierFilter, setStorageTierFilter] = useState<'all' | StorageDurabilityTier>('all');
  const [storageSnapshot, setStorageSnapshot] = useState<ContractStorageSnapshot | null>(null);
  const [loadingStorage, setLoadingStorage] = useState<boolean>(false);
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});

  // Copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadLedgers = async () => {
    setLoadingLedgers(true);
    const data = await fetchLatestLedgers(currentNetwork);
    setLedgers(data);
    setLoadingLedgers(false);
  };

  const loadEvents = async () => {
    setLoadingEvents(true);
    const evts = await fetchLiveSorobanEvents(currentNetwork, 10);
    setEvents(evts);
    setLoadingEvents(false);
  };

  useEffect(() => {
    loadLedgers();
    loadEvents();
    const interval = setInterval(() => {
      loadLedgers();
      loadEvents();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentNetwork]);

  const handleDecodeXDR = () => {
    setXdrError(null);
    try {
      const res = decodeXDRString(xdrInput);
      setXdrResult(res);
    } catch (err: any) {
      setXdrError(err.message || 'Failed to decode XDR');
      setXdrResult(null);
    }
  };

  const handleInvokeContract = async () => {
    setInvoking(true);
    setContractResult(null);
    setLastSimulationXdr(null);

    let parsedArgs: any[] = [];
    try {
      parsedArgs = JSON.parse(argsJson);
    } catch (parseErr) {
      parsedArgs = [argsJson];
    }

    const sim = await simulateSorobanContract(
      currentNetwork,
      contractId.trim(),
      functionName.trim(),
      parsedArgs
    );

    setInvoking(false);
    setContractResult(JSON.stringify(sim.data, null, 2));
    if (sim.rawXdr) {
      setLastSimulationXdr(sim.rawXdr);
    }
  };

  const handleInspectStorage = async () => {
    setLoadingStorage(true);
    const keys = storageProbeKeys
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    const snap = await fetchContractStorage(currentNetwork, storageContractId, keys);
    setStorageSnapshot(snap);
    const nextExpanded: Record<string, boolean> = {};
    snap.entries.forEach((entry) => {
      nextExpanded[entry.id] = true;
    });
    setExpandedEntries(nextExpanded);
    setLoadingStorage(false);
  };

  const toggleEntryExpanded = (id: string) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sendToXdrInspector = (xdrStr: string) => {
    setXdrInput(xdrStr);
    setActiveTab('xdr');
    try {
      const res = decodeXDRString(xdrStr);
      setXdrResult(res);
      setXdrError(null);
    } catch (err: any) {
      setXdrError(err.message || 'Failed to decode XDR');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredStorageEntries = (storageSnapshot?.entries || []).filter(
    (e) => storageTierFilter === 'all' || e.tier === storageTierFilter
  );

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
      {/* Console Tab Header */}
      <div className="bg-slate-100 border-b-2 border-black p-2 flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ledgers')}
          className={`neo-badge cursor-pointer flex items-center gap-1 py-1 px-3 text-xs ${
            activeTab === 'ledgers' ? 'bg-blue-600 text-white' : 'bg-white text-black'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>LEDGERS</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`neo-badge cursor-pointer flex items-center gap-1 py-1 px-3 text-xs ${
            activeTab === 'events' ? 'bg-blue-600 text-white' : 'bg-white text-black'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>SOROBAN EVENTS ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('xdr')}
          className={`neo-badge cursor-pointer flex items-center gap-1 py-1 px-3 text-xs ${
            activeTab === 'xdr' ? 'bg-blue-600 text-white' : 'bg-white text-black'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>XDR DECODER</span>
        </button>

        <button
          onClick={() => setActiveTab('interactor')}
          className={`neo-badge cursor-pointer flex items-center gap-1 py-1 px-3 text-xs ${
            activeTab === 'interactor' ? 'bg-blue-600 text-white' : 'bg-white text-black'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>CONTRACT SIMULATOR</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`neo-badge cursor-pointer flex items-center gap-1 py-1 px-3 text-xs ${
            activeTab === 'storage' ? 'bg-blue-600 text-white' : 'bg-white text-black'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>STORAGE EXPLORER</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`neo-badge cursor-pointer flex items-center gap-1 py-1 px-3 text-xs ${
            activeTab === 'logs' ? 'bg-blue-600 text-white' : 'bg-white text-black'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>PROVIDER LOGS ({providerLogs.length})</span>
        </button>
      </div>

      {/* Tab Body Content */}
      <div className="flex-1 p-3 overflow-y-auto bg-slate-50 font-mono text-xs">
        {/* TAB 1: Horizon Ledgers */}
        {activeTab === 'ledgers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white border-2 border-black p-2.5 rounded-lg shadow-[2px_2px_0px_0px_#000]">
              <span className="font-extrabold text-black">
                Horizon Blocks ({currentNetwork.name})
              </span>
              <button
                onClick={loadLedgers}
                disabled={loadingLedgers}
                className="neo-btn text-xs py-1 px-2.5"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLedgers ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {ledgers.length === 0 ? (
              <div className="neo-box p-6 text-center text-slate-500 font-sans">
                Connecting to {currentNetwork.horizonUrl}...
              </div>
            ) : (
              <div className="space-y-2">
                {ledgers.map((l) => (
                  <div key={l.id} className="neo-box p-2.5 hover:border-blue-600 transition-colors">
                    <div className="flex items-center justify-between text-black font-extrabold mb-1">
                      <span className="text-blue-600">Ledger #{l.sequence}</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 border border-black rounded">
                        Protocol v{l.protocolVersion}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate mb-1">
                      Hash: <code className="bg-slate-100 px-1 border border-black">{l.hash}</code>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>
                        Tx Count: <strong>{l.txCount}</strong>
                      </span>
                      <span>
                        Operations: <strong>{l.operationCount}</strong>
                      </span>
                      <span>
                        Closed: <strong>{l.closedAt}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Soroban Events */}
        {activeTab === 'events' && (
          <div className="space-y-3 font-sans">
            <div className="neo-box p-3 bg-blue-50 border-black flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-black flex items-center gap-1.5 mb-1">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Live Soroban RPC Events ({currentNetwork.name})</span>
                </h4>
                <p className="text-xs text-slate-600 font-mono">
                  RPC: {currentNetwork.sorobanRpcUrl}
                </p>
              </div>
              <button
                onClick={loadEvents}
                disabled={loadingEvents}
                className="neo-btn text-xs py-1 px-2.5"
              >
                <RefreshCw className={`w-3 h-3 ${loadingEvents ? 'animate-spin' : ''}`} />
                <span>Poll RPC</span>
              </button>
            </div>

            {events.length === 0 ? (
              <div className="neo-box p-6 text-center text-slate-500 font-mono text-xs">
                No recent contract events in range on {currentNetwork.name}.
              </div>
            ) : (
              <div className="space-y-2 font-mono">
                {events.map((evt) => (
                  <div key={evt.id} className="neo-box p-3 border-black">
                    <div className="flex items-center justify-between text-xs font-bold mb-1 text-black">
                      <span className="text-blue-600">Ledger #{evt.ledger}</span>
                      <span className="neo-badge bg-yellow-200">{evt.type}</span>
                    </div>
                    <div className="text-[11px] text-slate-700 space-y-1">
                      <div className="truncate">
                        Contract:{' '}
                        <code className="bg-slate-100 px-1 border border-black">
                          {evt.contractId}
                        </code>
                      </div>
                      <div>
                        Topics:{' '}
                        <code className="bg-slate-100 px-1 border border-black">
                          {evt.topics.join(' , ') || 'none'}
                        </code>
                      </div>
                      <div className="truncate">
                        Data XDR:{' '}
                        <code className="bg-slate-100 px-1 border border-black">{evt.data}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: XDR Inspector */}
        {activeTab === 'xdr' && (
          <div className="space-y-3 font-sans">
            <div className="neo-box p-3 bg-white border-black">
              <label className="block text-xs font-extrabold text-black mb-1">
                Paste Base64 XDR Payload String:
              </label>
              <textarea
                value={xdrInput}
                onChange={(e) => setXdrInput(e.target.value)}
                rows={4}
                className="neo-input w-full font-mono text-xs"
              />
              <div className="mt-2 flex justify-end">
                <button onClick={handleDecodeXDR} className="neo-btn-blue text-xs">
                  <Search className="w-3.5 h-3.5" />
                  <span>Decode XDR</span>
                </button>
              </div>
            </div>

            {xdrError && (
              <div className="neo-box bg-red-100 border-red-950 p-3 text-red-900 font-mono text-xs">
                Error: {xdrError}
              </div>
            )}

            {xdrResult && (
              <div className="neo-box p-3 bg-white border-black">
                <div className="flex items-center justify-between font-mono font-bold text-xs text-blue-600 mb-2">
                  <span>Type: {xdrResult.type}</span>
                  <button
                    onClick={() => copyToClipboard(xdrResult.raw, 'xdr')}
                    className="p-1 hover:bg-slate-100 rounded border border-black"
                  >
                    {copiedId === 'xdr' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded border-2 border-black overflow-x-auto text-[11px] font-mono leading-relaxed">
                  {xdrResult.raw}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Contract Simulator */}
        {activeTab === 'interactor' && (
          <div className="space-y-3 font-sans">
            <div className="neo-box p-3 bg-white border-black space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  Live Soroban RPC Invocation Simulator
                </span>
                <span className="neo-badge bg-blue-100 text-blue-900">{currentNetwork.name}</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Contract ID:</label>
                <input
                  type="text"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  className="neo-input w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">Function Name:</label>
                <input
                  type="text"
                  value={functionName}
                  onChange={(e) => setFunctionName(e.target.value)}
                  className="neo-input w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  JSON Arguments Array:
                </label>
                <input
                  type="text"
                  value={argsJson}
                  onChange={(e) => setArgsJson(e.target.value)}
                  className="neo-input w-full font-mono text-xs"
                />
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  onClick={handleInvokeContract}
                  disabled={invoking}
                  className="neo-btn-blue text-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${invoking ? 'animate-spin' : ''}`} />
                  <span>{invoking ? 'Simulating on RPC...' : 'Simulate on Soroban RPC'}</span>
                </button>
              </div>
            </div>

            {contractResult && (
              <div className="neo-box p-3 bg-white border-black space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-black">
                    RPC Simulation Result:
                  </span>
                  {lastSimulationXdr && (
                    <button
                      onClick={() => sendToXdrInspector(lastSimulationXdr)}
                      className="neo-btn text-[11px] py-1 px-2 flex items-center gap-1 bg-yellow-200"
                    >
                      <span>Inspect Simulation XDR</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <pre className="bg-slate-900 text-blue-300 p-3 rounded border-2 border-black overflow-x-auto text-[11px] font-mono">
                  {contractResult}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Contract Storage Explorer */}
        {activeTab === 'storage' && (
          <div className="space-y-3 font-sans">
            <div className="neo-box p-3 bg-white border-black space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Soroban Contract Storage Explorer</span>
                </span>
                <span className="neo-badge bg-blue-100 text-blue-900">{currentNetwork.name}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Contract ID (C...):
                </label>
                <input
                  type="text"
                  value={storageContractId}
                  onChange={(e) => setStorageContractId(e.target.value)}
                  placeholder="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
                  className="neo-input w-full font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Persistent / Temporary Key Probes (comma-separated symbols or G.../C... addresses):
                </label>
                <input
                  type="text"
                  value={storageProbeKeys}
                  onChange={(e) => setStorageProbeKeys(e.target.value)}
                  placeholder="Admin, TotalSupply, GBRPYHIL..."
                  className="neo-input w-full font-mono text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1">
                  {(['all', 'instance', 'persistent', 'temporary'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setStorageTierFilter(tier)}
                      className={`px-2 py-1 text-[10px] font-mono font-black uppercase rounded border-2 border-black cursor-pointer ${
                        storageTierFilter === tier
                          ? 'bg-black text-white'
                          : 'bg-slate-100 text-black hover:bg-yellow-200'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleInspectStorage}
                  disabled={loadingStorage}
                  className="neo-btn-blue text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingStorage ? 'animate-spin' : ''}`} />
                  <span>{loadingStorage ? 'Fetching Storage...' : 'Fetch Storage Entries'}</span>
                </button>
              </div>
            </div>

            {storageSnapshot?.error && (
              <div className="neo-box bg-red-100 border-red-950 p-3 text-red-900 font-mono text-xs">
                Storage RPC Error: {storageSnapshot.error}
              </div>
            )}

            {storageSnapshot && !storageSnapshot.error && (
              <div className="space-y-2 font-mono">
                <div className="neo-box p-2.5 bg-yellow-100 border-black flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div>
                    <span className="font-bold text-black">Executable: </span>
                    <span>{storageSnapshot.executableType || 'Unknown / Not Found'}</span>
                  </div>
                  {storageSnapshot.latestLedger && (
                    <div>
                      <span className="font-bold text-black">Latest Ledger: </span>
                      <span>#{storageSnapshot.latestLedger}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-black">Matched Entries: </span>
                    <span>{filteredStorageEntries.length}</span>
                  </div>
                </div>

                {filteredStorageEntries.length === 0 ? (
                  <div className="neo-box p-6 text-center text-slate-600 bg-white border-black">
                    No storage entries found for the selected durability filter (
                    <span className="font-bold uppercase">{storageTierFilter}</span>) on{' '}
                    {storageSnapshot.network}.
                  </div>
                ) : (
                  filteredStorageEntries.map((entry) => {
                    const isOpen = !!expandedEntries[entry.id];
                    const tierColor =
                      entry.tier === 'instance'
                        ? 'bg-blue-200 text-blue-950'
                        : entry.tier === 'persistent'
                          ? 'bg-emerald-200 text-emerald-950'
                          : 'bg-amber-200 text-amber-950';

                    return (
                      <div key={entry.id} className="neo-box bg-white border-black overflow-hidden">
                        <div className="flex items-center justify-between p-2.5 bg-slate-100 border-b-2 border-black">
                          <button
                            onClick={() => toggleEntryExpanded(entry.id)}
                            className="flex items-center gap-1.5 text-left font-extrabold text-black cursor-pointer truncate"
                          >
                            {isOpen ? (
                              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className={`neo-badge text-[10px] px-1.5 py-0.5 ${tierColor}`}>
                              {entry.tier.toUpperCase()}
                            </span>
                            <span className="text-blue-700 truncate">{entry.keyLabel}</span>
                            <span className="text-[10px] text-slate-500">({entry.valueType})</span>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {entry.liveUntilLedgerSeq && (
                              <span className="text-[10px] bg-white px-1.5 py-0.5 border border-black rounded">
                                TTL #{entry.liveUntilLedgerSeq}
                              </span>
                            )}
                            <button
                              onClick={() =>
                                copyToClipboard(entry.formattedValue, `val-${entry.id}`)
                              }
                              title="Copy decoded storage value"
                              className="p-1 bg-white hover:bg-yellow-200 rounded border border-black"
                            >
                              {copiedId === `val-${entry.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-black" />
                              )}
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="p-2.5 space-y-2 bg-white">
                            <pre className="bg-slate-900 text-emerald-300 p-2.5 rounded border-2 border-black overflow-x-auto text-[11px] leading-relaxed">
                              {entry.formattedValue}
                            </pre>
                            {entry.rawXdr && (
                              <div className="flex items-center justify-between text-[10px] text-slate-600">
                                <span className="truncate max-w-[70%]">
                                  Raw XDR: <code>{entry.rawXdr}</code>
                                </span>
                                <button
                                  onClick={() => sendToXdrInspector(entry.rawXdr!)}
                                  className="underline font-bold text-black hover:text-blue-600 cursor-pointer"
                                >
                                  Open in XDR Decoder →
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: Provider Event Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-2 font-mono">
            {providerLogs.length === 0 ? (
              <div className="neo-box p-6 text-center text-slate-500 font-sans">
                No RPC/Provider calls received from dApp yet.
              </div>
            ) : (
              providerLogs.map((log) => (
                <div key={log.id} className="neo-box p-2.5 bg-white border-black">
                  <div className="flex items-center justify-between text-black font-bold mb-1">
                    <span className="text-blue-600">{log.method}()</span>
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  </div>
                  {log.params && (
                    <div className="text-[11px] text-slate-600 truncate">
                      Params:{' '}
                      <code className="bg-slate-100 px-1 border border-black">
                        {JSON.stringify(log.params)}
                      </code>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

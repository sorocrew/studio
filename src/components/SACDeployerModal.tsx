import React, { useState } from 'react';
import { NetworkConfig, AccountInfo } from '../types';
import {
  deploySACWithAsset,
  generateTestKeypair,
  SACDeploymentResult,
} from '../services/stellar';
import { Rocket, X, Copy, Check, Sparkles, Loader2 } from 'lucide-react';

export interface SACDeployerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNetwork: NetworkConfig;
  activeAccount: AccountInfo;
}

export const SACDeployerModal: React.FC<SACDeployerModalProps> = ({
  isOpen,
  onClose,
  currentNetwork,
  activeAccount,
}) => {
  const [assetCode, setAssetCode] = useState<string>('USDC');
  const [issuerKey, setIssuerKey] = useState<string>(
    'GBRPYHIL2CI3FNQ4BXLFMNDLFPPPU2HY44TOE355KCXAZUOWVYOO4ZF'
  );
  const [deploying, setDeploying] = useState<boolean>(false);
  const [result, setResult] = useState<SACDeploymentResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerateRandomIssuer = () => {
    const pair = generateTestKeypair();
    setIssuerKey(pair.publicKey);
  };

  const handleUseNativeXlm = () => {
    setAssetCode('XLM');
    setIssuerKey('');
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeploying(true);
    setResult(null);
    setCopied(false);

    const res = await deploySACWithAsset(
      currentNetwork,
      assetCode,
      issuerKey,
      activeAccount.secretKey
    );
    setResult(res);
    setDeploying(false);
  };

  const handleCopyContractId = () => {
    if (!result?.contractId) return;
    navigator.clipboard.writeText(result.contractId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sac-deployer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-lg bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_#000000] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between bg-yellow-300 border-b-4 border-black px-4 py-3">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-black" />
            <h2
              id="sac-deployer-modal-title"
              className="font-['Black_Ops_One'] text-base tracking-wide text-black uppercase"
            >
              1-Click Soroban SAC Deployer
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close SAC Deployer Modal"
            className="p-1 bg-white border-2 border-black rounded hover:bg-red-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleDeploy} className="p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between bg-slate-100 border-2 border-black rounded-lg px-3 py-2 font-mono">
            <span>
              Target Network: <strong className="text-blue-600">{currentNetwork.name}</strong>
            </span>
            <button
              type="button"
              onClick={handleUseNativeXlm}
              className="underline font-bold text-black hover:text-blue-600 cursor-pointer"
            >
              Preset: Native XLM
            </button>
          </div>

          <div>
            <label className="block font-extrabold text-black mb-1 uppercase">
              Asset Code (1–12 chars):
            </label>
            <input
              type="text"
              maxLength={12}
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
              placeholder="USDC"
              required
              className="neo-input w-full font-mono text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-extrabold text-black uppercase">
                Issuer Public Key (G... or leave blank for Native XLM):
              </label>
              <button
                type="button"
                onClick={handleGenerateRandomIssuer}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-blue-600 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Random Issuer</span>
              </button>
            </div>
            <input
              type="text"
              value={issuerKey}
              onChange={(e) => setIssuerKey(e.target.value)}
              placeholder="GBRPYHIL2CI3FNQ4BXLFMNDLFPPPU2HY44TOE355KCXAZUOWVYOO4ZF"
              className="neo-input w-full font-mono text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="neo-btn text-xs py-2 px-3 bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deploying}
              className="neo-btn-blue text-xs py-2 px-4"
            >
              {deploying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              <span>{deploying ? 'Deploying SAC...' : 'Deploy SAC Contract'}</span>
            </button>
          </div>
        </form>

        {/* Deployment Result */}
        {result && (
          <div className="px-4 pb-4">
            {!result.success ? (
              <div className="neo-box bg-red-100 border-red-950 p-3 text-red-900 font-mono text-xs">
                <strong>Error:</strong> {result.message}
              </div>
            ) : (
              <div className="neo-box bg-emerald-50 border-black p-3 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-black">
                    Asset: <span className="text-blue-700">{result.assetLabel}</span>
                  </span>
                  <span className="neo-badge bg-emerald-300 text-black text-[10px]">
                    {result.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-700 font-sans">{result.message}</p>

                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Deployed Soroban Contract ID (56 chars):
                  </span>
                  <div className="flex items-center gap-1.5 bg-white border-2 border-black rounded p-2">
                    <code className="flex-1 text-[11px] font-bold text-black break-all">
                      {result.contractId}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyContractId}
                      title="Copy Contract ID"
                      className="neo-btn text-[11px] py-1 px-2 bg-yellow-300 shrink-0"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-black" />
                      )}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {result.txHash && (
                  <div className="text-[10px] text-slate-600 truncate">
                    Tx Hash: <code>{result.txHash}</code>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SACDeployerModal;

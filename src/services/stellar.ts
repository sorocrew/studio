import * as StellarSdk from '@stellar/stellar-sdk';
import { NetworkConfig, NetworkType, HorizonLedger, SorobanEvent, DecodedXDR } from '../types';

export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    id: 'mainnet',
    name: 'Mainnet',
    horizonUrl: 'https://horizon.stellar.org',
    sorobanRpcUrl: 'https://mainnet.soroban.stellar.org',
    networkPassphrase: StellarSdk.Networks.PUBLIC,
  },
  testnet: {
    id: 'testnet',
    name: 'Testnet',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: StellarSdk.Networks.TESTNET,
    friendbotUrl: 'https://friendbot.stellar.org',
  },
  futurenet: {
    id: 'futurenet',
    name: 'Futurenet',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
    sorobanRpcUrl: 'https://rpc-futurenet.stellar.org',
    networkPassphrase: StellarSdk.Networks.FUTURENET,
    friendbotUrl: 'https://friendbot-futurenet.stellar.org',
  },
  local: {
    id: 'local',
    name: 'Local Quickstart',
    horizonUrl: 'http://localhost:8000',
    sorobanRpcUrl: 'http://localhost:8000/soroban/rpc',
    networkPassphrase: 'Standalone Network ; February 2017',
    friendbotUrl: 'http://localhost:8000/friendbot',
    isLocal: true,
  },
};

// Fetch latest ledgers from Horizon
export async function fetchLatestLedgers(network: NetworkConfig, limit = 10): Promise<HorizonLedger[]> {
  try {
    const server = new StellarSdk.Horizon.Server(network.horizonUrl);
    const response = await server.ledgers().order('desc').limit(limit).call();
    return response.records.map((r: any) => ({
      id: r.id,
      sequence: r.sequence,
      hash: r.hash,
      txCount: r.successful_transaction_count + r.failed_transaction_count,
      operationCount: r.operation_count,
      closedAt: new Date(r.closed_at).toLocaleTimeString(),
      protocolVersion: r.protocol_version,
    }));
  } catch (err) {
    console.warn(`[Horizon] Unable to fetch ledgers from ${network.name}:`, err);
    return [];
  }
}

// Request Friendbot testnet XLM
export async function fundAccountWithFriendbot(network: NetworkConfig, publicKey: string): Promise<{ success: boolean; message: string }> {
  if (!network.friendbotUrl) {
    return { success: false, message: 'Friendbot is not available on this network.' };
  }
  try {
    const res = await fetch(`${network.friendbotUrl}?addr=${encodeURIComponent(publicKey)}`);
    if (res.ok) {
      return { success: true, message: `Successfully funded ${publicKey.slice(0, 8)}... with 10,000 test XLM!` };
    } else {
      const errText = await res.text();
      return { success: false, message: `Friendbot error: ${errText}` };
    }
  } catch (err: any) {
    return { success: false, message: `Failed to connect to Friendbot: ${err.message || err}` };
  }
}

// Fetch Account XLM Balance
export async function fetchAccountBalance(network: NetworkConfig, publicKey: string): Promise<string> {
  try {
    const server = new StellarSdk.Horizon.Server(network.horizonUrl);
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b: any) => b.asset_type === 'native');
    return nativeBalance ? parseFloat(nativeBalance.balance).toLocaleString() + ' XLM' : '0 XLM';
  } catch (err) {
    return '0 XLM (Unfunded)';
  }
}

// XDR Decoder helper
export function decodeXDRString(xdrString: string): DecodedXDR {
  const trimmed = xdrString.trim();
  if (!trimmed) {
    throw new Error('Please enter a non-empty XDR string');
  }

  // Try decoding as TransactionEnvelope
  try {
    const tx = StellarSdk.xdr.TransactionEnvelope.fromXDR(trimmed, 'base64');
    return {
      type: 'TransactionEnvelope',
      json: tx.toXDR('base64'),
      raw: JSON.stringify(tx.toXDR('base64'), null, 2),
    };
  } catch (e) {}

  // Try decoding as TransactionResult
  try {
    const res = StellarSdk.xdr.TransactionResult.fromXDR(trimmed, 'base64');
    return {
      type: 'TransactionResult',
      json: res.result().switch().name,
      raw: JSON.stringify(res, null, 2),
    };
  } catch (e) {}

  // Try decoding as ScVal
  try {
    const scVal = StellarSdk.xdr.ScVal.fromXDR(trimmed, 'base64');
    return {
      type: 'Soroban ScVal',
      json: scVal.switch().name,
      raw: JSON.stringify(scVal, null, 2),
    };
  } catch (e) {}

  return {
    type: 'Raw XDR String',
    json: { length: trimmed.length, preview: trimmed.slice(0, 32) + '...' },
    raw: trimmed,
  };
}

// Generate a random Stellar test keypair
export function generateTestKeypair(): { publicKey: string; secretKey: string } {
  const pair = StellarSdk.Keypair.random();
  return {
    publicKey: pair.publicKey(),
    secretKey: pair.secret(),
  };
}

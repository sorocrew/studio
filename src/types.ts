export type NetworkType = 'mainnet' | 'testnet' | 'futurenet' | 'local';

export interface NetworkConfig {
  id: NetworkType;
  name: string;
  horizonUrl: string;
  sorobanRpcUrl: string;
  networkPassphrase: string;
  friendbotUrl?: string;
  isLocal?: boolean;
}

export interface AccountInfo {
  name: string;
  publicKey: string;
  secretKey: string;
  balanceXlm?: string;
}

export interface HorizonLedger {
  id: string;
  sequence: number;
  hash: string;
  txCount: number;
  operationCount: number;
  closedAt: string;
  protocolVersion: number;
}

export interface SorobanEvent {
  id: string;
  contractId: string;
  topics: string[];
  data: string;
  ledger: number;
  timestamp: string;
  type: string;
}

export interface DecodedXDR {
  type: string;
  json: any;
  raw: string;
}

export interface ProviderLog {
  id: string;
  timestamp: string;
  method: string;
  params?: any;
  result?: any;
  error?: string;
}

import * as StellarSdk from '@stellar/stellar-sdk';
import {
  NetworkConfig,
  ContractStorageEntry,
  ContractStorageSnapshot,
  StorageDurabilityTier,
} from '../types';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeForJson(val: any): any {
  if (typeof val === 'bigint') {
    return val.toString();
  }
  if (val instanceof Uint8Array) {
    return `0x${bytesToHex(val)}`;
  }
  if (Array.isArray(val)) {
    return val.map(normalizeForJson);
  }
  if (val && typeof val === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = normalizeForJson(v);
    }
    return out;
  }
  return val;
}

export function decodeScValReadable(scVal: StellarSdk.xdr.ScVal): {
  type: string;
  value: any;
  formatted: string;
} {
  const switchName = scVal.switch().name;
  try {
    const native = StellarSdk.scValToNative(scVal);
    const normalized = normalizeForJson(native);
    const formatted =
      typeof normalized === 'string'
        ? normalized
        : JSON.stringify(normalized, null, 2);
    return {
      type: switchName,
      value: normalized,
      formatted,
    };
  } catch {
    try {
      if (switchName === 'scvSymbol') {
        const sym = scVal.sym().toString();
        return { type: switchName, value: sym, formatted: sym };
      }
      if (switchName === 'scvString') {
        const str = scVal.str().toString();
        return { type: switchName, value: str, formatted: str };
      }
      if (switchName === 'scvBytes') {
        const hex = `0x${bytesToHex(scVal.bytes())}`;
        return { type: switchName, value: hex, formatted: hex };
      }
      if (switchName === 'scvMap' && scVal.map()) {
        const mapObj: Record<string, any> = {};
        for (const item of scVal.map() || []) {
          const k = decodeScValReadable(item.key()).formatted;
          mapObj[k] = decodeScValReadable(item.val()).value;
        }
        return {
          type: switchName,
          value: mapObj,
          formatted: JSON.stringify(mapObj, null, 2),
        };
      }
      if (switchName === 'scvVec' && scVal.vec()) {
        const arr = (scVal.vec() || []).map((v) => decodeScValReadable(v).value);
        return {
          type: switchName,
          value: arr,
          formatted: JSON.stringify(arr, null, 2),
        };
      }
    } catch {
      // Fall back to base64 XDR representation below
    }
    const base64 = scVal.toXDR('base64');
    return {
      type: switchName,
      value: base64,
      formatted: base64,
    };
  }
}

export function parseStorageKeyInput(rawKey: string): StellarSdk.xdr.ScVal {
  const trimmed = rawKey.trim();
  if ((trimmed.startsWith('G') || trimmed.startsWith('C')) && trimmed.length === 56) {
    return new StellarSdk.Address(trimmed).toScVal();
  }
  if (/^-?\d+$/.test(trimmed)) {
    return StellarSdk.nativeToScVal(BigInt(trimmed));
  }
  if (trimmed.startsWith('sym:')) {
    return StellarSdk.xdr.ScVal.scvSymbol(trimmed.slice(4));
  }
  if (trimmed.startsWith('str:')) {
    return StellarSdk.xdr.ScVal.scvString(trimmed.slice(4));
  }
  return StellarSdk.xdr.ScVal.scvSymbol(trimmed);
}

/**
 * Fetches and decodes Soroban contract instance storage plus any requested
 * Persistent and Temporary ledger keys via Soroban RPC `getLedgerEntries`.
 */
export async function fetchContractStorage(
  network: NetworkConfig,
  contractId: string,
  probeKeys: string[] = ['Admin', 'ADMIN', 'TotalSupply', 'Metadata', 'Config', 'State']
): Promise<ContractStorageSnapshot> {
  const cleanedId = contractId.trim();
  if (!cleanedId) {
    return {
      contractId: cleanedId,
      network: network.name,
      entries: [],
      error: 'Please provide a valid 56-character Soroban Contract ID (C...).',
    };
  }

  let contract: StellarSdk.Contract;
  let contractScAddress: StellarSdk.xdr.ScAddress;
  try {
    contract = new StellarSdk.Contract(cleanedId);
    contractScAddress = new StellarSdk.Address(cleanedId).toScAddress();
  } catch (err: any) {
    return {
      contractId: cleanedId,
      network: network.name,
      entries: [],
      error: `Invalid Contract ID format: ${err.message || String(err)}`,
    };
  }

  try {
    const rpcServer = new StellarSdk.rpc.Server(network.sorobanRpcUrl, {
      allowHttp: network.sorobanRpcUrl.startsWith('http://'),
    });

    const ledgerKeys: StellarSdk.xdr.LedgerKey[] = [contract.getFootprint()];
    const keyMeta: Array<{ tier: StorageDurabilityTier; label: string }> = [
      { tier: 'instance', label: '__CONTRACT_INSTANCE__' },
    ];

    const uniqueProbes = Array.from(
      new Set(probeKeys.map((k) => k.trim()).filter(Boolean))
    );

    for (const rawProbe of uniqueProbes) {
      try {
        const scKey = parseStorageKeyInput(rawProbe);
        for (const tier of ['persistent', 'temporary'] as const) {
          const durability =
            tier === 'temporary'
              ? StellarSdk.xdr.ContractDataDurability.temporary()
              : StellarSdk.xdr.ContractDataDurability.persistent();
          const lk = StellarSdk.xdr.LedgerKey.contractData(
            new StellarSdk.xdr.LedgerKeyContractData({
              contract: contractScAddress,
              key: scKey,
              durability,
            })
          );
          ledgerKeys.push(lk);
          keyMeta.push({ tier, label: rawProbe });
        }
      } catch {
        // Ignore unparseable custom key probe
      }
    }

    const response = await rpcServer.getLedgerEntries(...ledgerKeys);
    const entries: ContractStorageEntry[] = [];
    let executableType: string | undefined;
    let wasmHashHex: string | undefined;

    for (const item of response.entries || []) {
      const anyEntry: any = item;
      const ledgerEntryData: StellarSdk.xdr.LedgerEntryData = anyEntry.val;
      if (ledgerEntryData.switch().name !== 'contractData') {
        continue;
      }

      const cd = ledgerEntryData.contractData();
      const keyScVal = cd.key();
      const valScVal = cd.val();
      const liveUntil: number | undefined = anyEntry.liveUntilLedgerSeq;
      const lastModified: number | undefined = anyEntry.lastModifiedLedgerSeq;

      if (keyScVal.switch().name === 'scvLedgerKeyContractInstance') {
        const instance = valScVal.instance();
        const exec = instance.executable();
        executableType = exec.switch().name;
        if (executableType === 'contractExecutableWasm') {
          wasmHashHex = bytesToHex(exec.wasmHash());
        }

        const instanceMap = instance.storage() || [];
        instanceMap.forEach((mapEntry, idx) => {
          const decodedK = decodeScValReadable(mapEntry.key());
          const decodedV = decodeScValReadable(mapEntry.val());
          entries.push({
            id: `instance-${idx}-${decodedK.formatted}`,
            tier: 'instance',
            keyLabel: decodedK.formatted,
            keyType: decodedK.type,
            valueType: decodedV.type,
            decodedValue: decodedV.value,
            formattedValue: decodedV.formatted,
            rawXdr: mapEntry.val().toXDR('base64'),
            liveUntilLedgerSeq: liveUntil,
            lastModifiedLedgerSeq: lastModified,
          });
        });
      } else {
        const durabilityName = cd.durability().name;
        const tier: StorageDurabilityTier =
          durabilityName === 'temporary' ? 'temporary' : 'persistent';
        const decodedK = decodeScValReadable(keyScVal);
        const decodedV = decodeScValReadable(valScVal);
        entries.push({
          id: `${tier}-${decodedK.formatted}`,
          tier,
          keyLabel: decodedK.formatted,
          keyType: decodedK.type,
          valueType: decodedV.type,
          decodedValue: decodedV.value,
          formattedValue: decodedV.formatted,
          rawXdr: valScVal.toXDR('base64'),
          liveUntilLedgerSeq: liveUntil,
          lastModifiedLedgerSeq: lastModified,
        });
      }
    }

    return {
      contractId: cleanedId,
      network: network.name,
      latestLedger: response.latestLedger,
      executableType,
      wasmHashHex,
      entries,
    };
  } catch (err: any) {
    return {
      contractId: cleanedId,
      network: network.name,
      entries: [],
      error: err.message || String(err),
    };
  }
}

# SoroCrew Studio 🚀

![SoroCrew Studio Banner](./crew-logo-white.svg)

> **The Soroban dApp Developer Environment** — Built strictly for Web3 developers on the Stellar blockchain.

SoroCrew Studio brings IDE-grade developer experience straight to your browser-based dApp testing tab with zero context switching.

---

## 🌟 Key Features

* ⚡ **Neo-Brutalist High-Contrast UI**: Modern black-on-white interface designed for ultra-clear visibility and focus.
* 🌐 **Universal Network Toggler**: Switch instant browser context between **Mainnet**, **Testnet**, **Futurenet**, and **Local Quickstart Docker** (`http://localhost:8000`).
* 📊 **Embedded Horizon Console**: Inspect network ledgers, block hashes, protocol versions, and transaction counts in real-time.
* 🔍 **Soroban Event Streamer & XDR Inspector**: Live monitor contract topics/events and parse raw Base64 XDR payloads into JSON structs.
* 💧 **1-Click Friendbot Faucet**: Instantly fund test keypairs with 10,000 test XLM on Testnet, Futurenet, or Localnet.
* 🧪 **Contract Interactor**: Simulate Wasm contract invocations with JSON arguments and inspect CPU/memory footprint estimates.

---

## 🛠️ Installation & Setup

### Prerequisites
* Node.js v18+ 
* Rust & Cargo (for Tauri Desktop builds)

### Development

```bash
# Clone the repository
git clone git@github.com:sorocrew/studio.git
cd studio

# Install dependencies
npm install

# Start local web development server
npm run dev
```

### Build Desktop App (Tauri)

```bash
# Build desktop binary
npm run tauri build
```

---

## 📁 Repository Structure

```
studio/
├── src/
│   ├── components/
│   │   ├── Header.tsx        # Network Toggler & Account Switcher
│   │   ├── BrowserPanel.tsx  # dApp Testing Iframe Frame
│   │   └── ConsolePanel.tsx  # Horizon Ledgers, Events & XDR Decoder
│   ├── services/
│   │   └── stellar.ts        # Stellar SDK & Horizon REST service
│   ├── App.tsx               # Main Workspace Layout
│   └── index.css             # Tailwind Neo-Brutalist Theme
├── index.html
└── tauri.conf.json
```

---

## 📄 License

MIT © [SoroCrew](https://github.com/sorocrew)

# Contributing to SoroCrew Studio

Thank you for your interest in contributing to **SoroCrew Studio**! SoroCrew participates in **Drips Waves** (drips.network) to fund and reward open-source contributors.

---

## 🗺️ SoroCrew Repository Ecosystem Map

If you're wondering which repository to work on:

| Repository | Focus Area | Technology |
| :--- | :--- | :--- |
| **`sorocrew/studio`** (This Repo) | Desktop Browser & IDE App UI, Horizon Console, XDR Inspector | Tauri 2.0 (Rust) + React + TypeScript + Tailwind CSS |
| **`sorocrew/provider`** | Injected JavaScript Wallet SDK (`@sorocrew/provider`) | TypeScript, tsup |
| **`sorocrew/quickstart`** | Local Standalone Soroban Docker Environment & CLI | Docker Compose, Shell, Node.js CLI |
| **`sorocrew/docs`** | Documentation Site & Landing Page | React + Vite + Tailwind CSS |

---

## 🌊 Drips Wave Contributor Workflow

If you are contributing via a **Drips Wave** (drips.network):

1. **Find an Issue:** Browse open issues tagged with `drips-wave` or `good first issue` on GitHub or the Drips Wave dashboard.
2. **Apply on Drips:** Click **Apply** on the issue in Drips Wave. Please do NOT start working until a maintainer assigns you to the issue.
3. **Get Assigned:** A maintainer will review applications and assign the issue on GitHub & Drips.
4. **Create a Branch:** Create a branch named `feat/short-description` or `fix/short-description`.
5. **Submit a PR:** Open a Pull Request referencing the issue number (e.g. `Fixes #12`).
6. **Review & Merge:** Once reviewed and merged, mark the task as complete in the Wave to receive your payout at the end of the wave cycle!

---

## 💻 Local Setup & Testing

```bash
git clone git@github.com:sorocrew/studio.git
cd studio

# Install dependencies
npm install

# Run typecheck & build test
npm run typecheck
npm run build

# Start local development server
npm run dev
```

---

## 📜 Pull Request Guidelines

* Keep PRs focused on a single issue.
* Ensure `npm run typecheck` passes with zero errors before submitting.
* Write clear PR descriptions using the provided PR template.

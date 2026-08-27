# Contributing to SoroCrew Studio

Thank you for your interest in contributing to **SoroCrew Studio**! SoroCrew participates in **Drips Waves** (drips.network) to fund open-source contributors.

---

## 🌿 Branching & Pull Request Workflow

### Default Branch: `dev`
All active development happens on the `dev` branch. The `main` branch is reserved for stable, production-ready releases only.

### How to Contribute
1. **Fork** the repository (external contributors) or create a branch (team members).
2. **Branch off `dev`**:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**, commit using [Conventional Commits](https://www.conventionalcommits.org/).
4. **Push to your fork/branch** and open a Pull Request **targeting `dev`**.
5. **Wait for CI checks** to pass (automated via GitHub Actions).
6. **Address review feedback** if requested.
7. **Merge** after approval (maintainers only).

### Branch Protection Rules
- ❌ Direct pushes to `main` are **not allowed**.
- ❌ Direct pushes to `dev` are **not allowed**.
- ✅ All changes must go through a Pull Request.
- ✅ CI status checks must pass before merging.
- ✅ At least 1 maintainer approval is required.

### Branch Naming Convention
- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation changes
- `test/` — Test additions/modifications
- `refactor/` — Code refactoring
- `chore/` — Maintenance tasks

---

## 🗺️ SoroCrew Repository Ecosystem Map

| Repository | Focus Area | Technology |
| :--- | :--- | :--- |
| **`sorocrew/studio`** (This Repo) | Desktop Browser & IDE App UI, Horizon Console, XDR Inspector | Tauri 2.0 (Rust) + React + TypeScript + Tailwind CSS |
| **`sorocrew/provider`** | Injected JavaScript Wallet SDK (`@sorocrew/provider`) | TypeScript, tsup |
| **`sorocrew/quickstart`** | Local Standalone Soroban Docker Environment & CLI | Docker Compose, Shell, Node.js CLI |
| **`sorocrew/docs`** | Documentation Site & Landing Page | React + Vite + Tailwind CSS |

---

## 🌊 Drips Wave Contributor Workflow

1. **Find an Issue:** Browse open issues tagged with `drips-wave` on GitHub or Drips.
2. **Apply on Drips:** Click **Apply** on Drips Wave. Do NOT start until assigned.
3. **Join Telegram Community:** Join [https://t.me/sorocrew](https://t.me/sorocrew) to coordinate with maintainers.
4. **Get Assigned:** Maintainers review and assign the issue.
5. **Submit PR targeting `dev`:** Open a PR targeting `dev` referencing the issue number and post your PR link in the Telegram `#PR Link` topic.
6. **Review & Payout:** After PR merge, receive your payout at the end of the wave cycle!

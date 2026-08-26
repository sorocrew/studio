# Development Guide

This document outlines how to set up your local development environment and run local CI checks for **SoroCrew Studio**.

---

## 🔍 Running CI Checks Locally

Before opening a Pull Request targeting the `dev` branch, run these checks locally to ensure all automated CI checks pass:

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Typecheck

```bash
npm run typecheck
```

### 3. Verify Production Build

```bash
npm run build
```

---

## 🌿 Git Branching Workflow

* All active development happens on the **`dev`** branch.
* Branch off `dev` for your changes:
  ```bash
  git checkout dev
  git pull origin dev
  git checkout -b feature/your-feature-name
  ```
* Open a Pull Request targeting **`dev`**.

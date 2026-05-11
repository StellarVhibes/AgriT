# AgriTrust Protocol 🚀

> **The Programmable Trust Layer for Smallholder Farmers** — Bridging the gap between the soil and the stablecoin.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-purple)](https://stellar.org)

## 🧠 Overview

**AgriTrust Protocol** is a liquidity primitive built on Stellar that turns a farmer's seasonal behavior (planting, harvesting, and selling) into a **Verifiable Yield Certificate (VYC)**. It allows smallholder farmers in Africa to access global liquidity and parametric insurance without needing traditional collateral like land titles.

---

## ❗ Problem

Smallholder farmers (60% of Africa's workforce) are **financially invisible**:

- 📉 Only 3% of bank lending goes to agriculture.
- 🚫 No "financial identity" or collateral.
- 💸 High exchange rate volatility and slow settlement.
- ⛈️ One bad harvest away from poverty with no insurance.

---

## 💡 Solution

AgriTrust creates a **3-step trust loop** using Soroban:

- 📝 **Proof of Activity:** Farmers log activity (e.g., buying seeds) via USSD/Mobile.
- 🎫 **VYC Primitive:** The protocol generates a tokenized certificate representing expected harvest value.
- 💰 **Instant Liquidity:** Investors provide liquidity against VYCs, settled instantly in USDC/Stablecoins.

---

## 🎯 Core Features

### 1. 🎫 Verifiable Yield Certificate (VYC)

- Tokenized asset (NFT/Token) representing "Expected Harvest Value".
- Based on historical data, weather patterns, and verified inputs.

### 2. ⚡ Instant Settlement

- Payouts in USDC or local stablecoins (NGNC, ZARP).
- Low-fee micro-transactions via Stellar.

### 3. ⛈️ Parametric Insurance

- Automated payouts if weather conditions (e.g., drought) are met.
- Enforced by Soroban smart contracts.

### 4. 🧠 Credit Scoring Engine

- Rule-based behavioral scoring for smallholder farmers.
- Turns "activity" into "creditworthiness".

---

## 🏗️ Technical Architecture

### 🔗 Blockchain Layer

- **Soroban Smart Contracts**
  - VYC generation logic
  - Liquidity matching & pools
  - Parametric insurance triggers
- **Stellar Network**
  - Fast, low-cost asset issuance
  - Native stablecoin support (USDC, NGNC, ZARP)

### 🖥️ Frontend

- Next.js (React)
- TypeScript & Tailwind CSS
- Mobile-first (PWA) with USSD hooks

### 🔌 Wallet Integration

- Freighter Wallet
- Stellar JS SDK

---

## 📂 Project Structure

```
AgriT/
├── smartcontract/     # Soroban VYC & Liquidity contracts
├── frontend/          # Next.js PWA frontend
├── docs/             # Development guides (FRONTEND_GUIDE, SMARTCONTRACT_GUIDE)
├── README.md         # This file
├── STYLE.md          # Code style guidelines
├── MAINTAINERS.md    # Project maintainers
├── CONTRIBUTING.md   # Contribution guidelines
└── CODE_OF_CONDUCT.md # Community code of conduct
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Rust & Cargo (for Soroban)
- Freighter Wallet

### Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### Setup Smart Contracts

```bash
cd smartcontract
cargo build
```

---

## 📚 Documentation

- 📘 **[Smart Contract Guide](./docs/SMARTCONTRACT_GUIDE.md)**
- 🌐 **[Frontend Integration Guide](./docs/FRONTEND_GUIDE.md)**
- 📋 **[PRD (Elite Project Proposal)](./PRD.md)**

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

_AgriTrust Protocol — Building the infrastructure of trust for the world's most underrepresented workforce._

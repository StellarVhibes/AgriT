# AgriTrust Smart Contracts 🧠

This directory contains the **Soroban** smart contracts for AgriTrust Protocol — the programmable trust layer for smallholder farmers on Stellar.

## 📚 Documentation

- **[Smart Contract Issues Tracker](../docs/ISSUES-SMARTCONTRACT.md)**: Roadmap for VYC and liquidity contracts.
- **[Development Guide](../docs/SMARTCONTRACT_GUIDE.md)**: Setup, build, and deploy instructions.

## 🚀 Quick Start

```bash
cargo build --all
cargo test
```

## Architecture

The smart contracts handle:
- **VYC Generation:** Tokenizing Proof of Activity into Verifiable Yield Certificates.
- **Liquidity Matching:** Managing investor pools and farmer payouts.
- **Parametric Insurance:** Logic for automated payouts based on weather/time conditions.
- **Asset Settlement:** Fast settlement in USDC or local stablecoins.

---

*Built on Soroban for the Stellar network.*

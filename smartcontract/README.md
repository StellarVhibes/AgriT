# IntentRemit Smart Contracts 🧠

This directory contains the **Soroban** smart contracts for IntentRemit — the Programmable Remittance with Purpose on Stellar.

## 📚 Documentation

- **[Smart Contract Issues Tracker](../docs/ISSUES-SMARTCONTRACT.md)**: Roadmap for time-lock and vault contracts.
- **[Development Guide](../docs/SMARTCONTRACT_GUIDE.md)**: Setup, build, and deploy instructions.

## 🚀 Quick Start

```bash
cargo build --all
cargo test
```

## Architecture

The smart contracts handle:
- Time-lock / vesting logic for Growth Vaults
- Conditional release rules (split percentages)
- Goal-based fund management
- Vault balance tracking and unlock scheduling

---

*Built on Soroban for the Stellar network.*
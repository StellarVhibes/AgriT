# Contributing to IntentRemit

Thank you for your interest in building the future of programmable remittances on Stellar! This guide will help you contribute effectively.

## 🛠 Tech Stack

- **Smart Contracts:** Soroban (Rust)
- **Frontend:** Next.js, TypeScript, Tailwind CSS, Freighter Wallet
- **Backend:** Node.js, rule-based allocation engine
- **Data:** Stellar SDK, Horizon API

## 📝 Commit Guidelines

We follow a **Modular Commit** philosophy to ensure history is readable and revertable.

**The Golden Rule:**
> "Commit after every meaningful change, not every line."

- **Meaningful Change:** Completing a function, finishing a fix, adding a feature block, creating a file, or making a significant modification.
- **Avoid:** Micro-commits for single-line edits unless they are standalone fixes.
- **Frequency:** Commit often, but only when you finish a logical piece of work.

### Example Commit Messages

- `feat(frontend): add goal selection flow`
- `fix(contract): correct time-lock validation`
- `docs: update vault configuration guide`
- `chore: update dependencies`

## 📋 Issue Tracking

1. Pick an issue from the `docs/` folder.
2. When you start, comment on the issue or mark it as "In Progress".
3. **When Completed:** You MUST update the issue file with:
   - Check the box `[x]`
   - Append your GitHub username and Date/Time.
   - *Example:* `- [x] Implement goal selection (@bbkenny - 2024-04-13 14:00)`

## 🧪 Development Workflow

1. **Clone**: Clone the repo locally.
2. **Branch**: Create a feature branch (`feat/my-feature`).
3. **Develop**: Write code following the Style Guide (`STYLE.md`).
4. **Test**: Run `cargo test` (contracts) or `npm run test` (frontend).
5. **Build**: Run `cargo build --all` or `npm run build` before committing.
6. **Commit**: Follow the commit guidelines above.

## Getting Help

Read the **Integration Guides** located in the `docs/` directory for detailed setup instructions.

---

*Help us transform remittances from consumption to growth!*
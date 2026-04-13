# Code Style Guide - IntentRemit

## JavaScript / TypeScript (Frontend & Backend)

- **Formatting:** Use Prettier with standard config
- **Linting:** ESLint with recommended rules
- **Components:** Functional components with typed props
- **State:** Use React Hooks (useState, useEffect, useContext)
- **Styling:** Tailwind CSS utility classes
- **Async:** Use async/await, handle errors properly
- **Types:** Always define interfaces for data structures

## Rust (Soroban Contracts)

- **Formatting:** Always run `cargo fmt`
- **Errors:** Use `Result<T, E>` for error handling
- **Safety:** Always use the `Env` object for authorization
- **Time Handling:** Be careful with timestamp comparisons for vault locks
- **Testing:** Write unit tests for each function

## Project Conventions

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts`
- Utils: `camelCase.ts`
- Types: `PascalCase.ts`

### Git Commits
- Follow modular commit philosophy
- Commit after meaningful changes
- Run build/compile before committing

## Integrity Checks

- **Frontend:** `npm run build` before pushing
- **Contracts:** `cargo build --all` before starting work
- **Typecheck:** `npm run typecheck` if available

---

*Always ensure the workspace is clean and compiles correctly.*
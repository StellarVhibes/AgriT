# Issue #11 evidence

- `dashboard-reconnect-state.png` shows the dashboard's Activity Feed handling an unreachable Soroban event stream with an actionable error and automatic retry.
- `npm test` passed: 21 tests, including event parsing, cursor pagination, and wallet-state relevance tests.
- `npm run build` passed.

A live testnet event screenshot is pending the deployed AgriTrust contract from issue #3, which is still open and has no published contract ID. The listener reads `NEXT_PUBLIC_VYC_CONTRACT_ID` and will begin streaming its `getEvents` feed once that deployment is available.

# Issue #11 evidence

- `dashboard-reconnect-state.png` shows the dashboard's Activity Feed handling an unreachable Soroban event stream with an actionable error and automatic retry.
- `npm test` passed: 21 tests, including event parsing, cursor pagination, and wallet-state relevance tests.
- `npm run build` passed.

The AgriTrust VYC contract from issue #3 is now deployed on testnet:
- **Contract ID**: `CAP5F2UJVEIDRIQFKN4T2JVW7IZC6KARIJXDV65IZEF7VYOSKRDGWXJU`
- The listener reads `NEXT_PUBLIC_VYC_CONTRACT_ID` and streams its `getEvents` feed from this contract.

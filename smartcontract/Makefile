build:
	cargo build --target wasm32-unknown-unknown --release

test:
	cargo test

fmt:
	cargo fmt

clean:
	cargo clean

# ── Deployment (Stellar Testnet) ──────────────────────────────────────────────
# Prerequisites:
#   1. Install Stellar CLI:  brew install stellar-cli
#   2. Generate keypair:     stellar keys generate admin --network testnet --overwrite
#      Fund it:             stellar keys fund admin
#      Get secret:          stellar keys secret admin
#
# Usage:
#   make build
#   make deploy-testnet ADMIN_SECRET=<SSECRET...>
#   make init-contract CONTRACT_ID=<C...> ADMIN_ADDRESS=<G...> ADMIN_SECRET=<SSECRET...>

NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
STELLAR_RPC_URL = https://soroban-testnet.stellar.org

WASM_PATH = target/wasm32-unknown-unknown/release/agritrust_vyc.wasm
WASM_OPT_PATH = target/wasm32-unknown-unknown/release/agritrust_vyc_optimized.wasm

deploy-testnet:
	@test -n "$(ADMIN_SECRET)" || (echo "Error: set ADMIN_SECRET=<SSECRET...>" && exit 1)
	@test -f $(WASM_PATH) || (echo "Error: run 'make build' first" && exit 1)
	@echo "Stripping reference-types from WASM..."
	wasm-opt -Oz --mvp-features --output $(WASM_OPT_PATH) $(WASM_PATH)
	stellar contract deploy \
		--wasm $(WASM_OPT_PATH) \
		--network testnet \
		--source "$(ADMIN_SECRET)"

init-contract:
	@test -n "$(CONTRACT_ID)" || (echo "Error: set CONTRACT_ID=<C...>" && exit 1)
	@test -n "$(ADMIN_ADDRESS)" || (echo "Error: set ADMIN_ADDRESS=<G...>" && exit 1)
	@test -n "$(ADMIN_SECRET)" || (echo "Error: set ADMIN_SECRET=<SSECRET...>" && exit 1)
	stellar contract invoke \
		--id $(CONTRACT_ID) \
		--network testnet \
		--source "$(ADMIN_SECRET)" \
		-- init --admin $(ADMIN_ADDRESS)

verify-testnet:
	@test -n "$(CONTRACT_ID)" || (echo "Error: set CONTRACT_ID=<C...>" && exit 1)
	@test -n "$(ADMIN_SECRET)" || (echo "Error: set ADMIN_SECRET=<SSECRET...>" && exit 1)
	@echo "── get_admin ──"
	stellar contract invoke \
		--id $(CONTRACT_ID) \
		--network testnet \
		--source "$(ADMIN_SECRET)" \
		-- get_admin
	@echo "── get_vyc_count ──"
	stellar contract invoke \
		--id $(CONTRACT_ID) \
		--network testnet \
		--source "$(ADMIN_SECRET)" \
		-- get_vyc_count

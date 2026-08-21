build:
	cargo build --target wasm32-unknown-unknown --release

test:
	cargo test

fmt:
	cargo fmt

clean:
	cargo clean

# Deploy to Stellar testnet
# Requires soroban-cli and a funded testnet identity
deploy-testnet:
	cargo build --target wasm32-unknown-unknown --release
	@echo "Deploying to Stellar testnet..."
	@echo "Make sure you have soroban-cli installed and a funded testnet identity configured"
	@echo "Usage: soroban contract deploy --wasm target/wasm32-unknown-unknown/release/agritrust_vyc.wasm --source <your-identity> --network testnet"
	@echo "After deployment, initialize with: soroban contract invoke --id <CONTRACT_ID> --source <admin> --network testnet -- init --admin <admin-address> --oracle <oracle-address>"

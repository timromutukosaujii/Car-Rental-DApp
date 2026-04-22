# Car Rental DApp (CN6035)

Car Rental DApp is a decentralized application for managing car reservations on Ethereum Sepolia.  
It combines:

1. A Solidity smart contract back end (`contracts/CarRental.sol`)
2. A Node.js read API backend (`backend/server.js`)
3. A React front end (`src/`)
4. Hardhat deployment/testing scripts (`scripts/`, `hardhat.config.js`)

The system allows users to connect MetaMask, estimate booking costs, submit bookings as blockchain transactions, and view booking history by wallet.

## Project Scope (Aligned to Coursework)

This repository is structured to satisfy the CN6035 task requirements:

1. DApp with functional front end and back end
2. Blockchain test network interaction (Sepolia)
3. Source code managed with version control (Git)
4. Code quality tooling (`eslint` scripts)
5. Technical report + installation manual included

## Key Features

1. Wallet connection with MetaMask
2. Booking flow with date and payment validation
3. Multi-car booking flow with simple split-plan support
4. On-chain reservation storage and lifecycle methods
5. Booking history retrieval from smart contract
6. Front-end feedback for success and error handling

## Tech Stack

1. Solidity `0.8.x`
2. Hardhat + Ethers.js
3. React `18`
4. MetaMask (Web3 provider)
5. Sepolia testnet
6. ESLint for code quality checks

## Repository Structure

1. `contracts/` smart contracts
2. `scripts/` deployment scripts
3. `src/components/` React UI components
4. `src/ABI/abi.json` contract ABI used by front end
5. `hardhat.config.js` network and build config
6. `TECHNICAL_REPORT.md` advanced technical report (500–2,000 words)
7. `INSTALLATION_MANUAL.md` install/deploy/run guide

## Quick Start

Follow `INSTALLATION_MANUAL.md` for full steps. Minimal flow:

```bash
npm install
npx hardhat run scripts/deploy.js --network sepolia
npm run start:backend
npm start
```

Open `http://localhost:3000`.

Backend health endpoint: `http://localhost:3001/health`.

## Backend API (Node)

The backend is a lightweight REST API for read operations against the deployed smart contract.

1. `GET /health`
2. `GET /api/cars`
3. `GET /api/availability?carType=Toyota%20Corolla`
4. `GET /api/estimate?carType=Toyota%20Corolla&pickUpDate=1767225600&dropOffDate=1767398400&carCount=1`
5. `GET /api/reservations/0x<wallet_address>`

## Environment Variables

Create `.env` in project root:

```env
API_URL="https://eth-sepolia.g.alchemy.com/v2/<your_key>"
PRIVATE_KEY="<your_64_hex_chars_private_key>"
REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS="0x<deployed_contract_address>"
REACT_APP_BACKEND_URL="http://localhost:3001"
BACKEND_PORT="3001"
```

Backend persistent storage file:

1. `backend/data/bookings.json`

When a booking is confirmed in the front end, the app now also stores customer and booking details in this backend file via `POST /api/local-bookings`.

Security note:

1. Never commit real private keys.
2. Use a test-only wallet.
3. Rotate keys immediately if exposed.

## Code Quality

Run lint checks:

```bash
npm run lint
```

Auto-fix where possible:

```bash
npm run lint:fix
```

Run contract tests:

```bash
npm run test:contracts
```

Run full quality gate:

```bash
npm run quality
```

## Code Quality Evidence

1. ESLint is configured across frontend, backend, scripts, tests, and Hardhat config.
2. Prettier is configured for consistent formatting.
3. Hardhat contract tests cover `CarRental` lifecycle scenarios.
4. Production build can be verified with `npm run build`.
5. Single-command verification is available via `npm run quality`.

## My Contributions

This project was forked from an open-source base. My own implementation work includes:

1. Sepolia deployment configuration and environment validation.
2. Node backend API and booking persistence implementation.
3. Wallet/network validation improvements in booking flow.
4. Booking UI enhancements and refactor for maintainability.
5. Installation manual and technical report updates.
6. Code quality tooling and contract testing improvements.

## Evidence for Marking Sheet

1. Back-end implementation (20): `contracts/CarRental.sol`
2. Blockchain interaction (20): `src/components/BookCar.jsx`, `src/components/BookingHistory.jsx`, `scripts/deploy.js`
3. Front-end implementation (20): `src/components/*`, `src/styles.css`
4. Code quality + version control (10): `package.json` lint scripts, Git commit history

## Documentation for Submission

1. Advanced technical report: `TECHNICAL_REPORT.md`
2. Installation manual: `INSTALLATION_MANUAL.md`
3. Full source code: this repository

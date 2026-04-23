# Car Rental DApp

A hybrid decentralized application for car booking.

It combines:

1. Smart contract booking logic on Sepolia (`contracts/CarRental.sol`)
2. Node.js + MongoDB Atlas backend API (`backend/server.js`)
3. React frontend (`src/`)

## What This Project Does

1. Lets users connect MetaMask and book cars on-chain
2. Calculates booking cost and deposit from contract rules
3. Stores booking profile/details in MongoDB Atlas
4. Shows booking history and status in the frontend

## Project Structure

1. `contracts/` Solidity contract
2. `scripts/` deployment scripts
3. `test/` contract tests (`CarRental.test.js`)
4. `backend/` API server + Mongoose model
5. `src/` React frontend UI

## Prerequisites

1. Node.js (LTS)
2. npm
3. MetaMask
4. Sepolia RPC URL (Alchemy/Infura)
5. MongoDB Atlas connection string

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`, then fill values:

```env
API_URL="https://eth-sepolia.g.alchemy.com/v2/<your_key>"
PRIVATE_KEY="<your_private_key>"
REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS="0x<deployed_contract_address>"
REACT_APP_BACKEND_URL="http://localhost:3001"
BACKEND_PORT=3001
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/car_rental_dapp?retryWrites=true&w=majority&appName=Cluster0"
MONGODB_DB_NAME="car_rental_dapp"
MONGODB_COLLECTION="bookings"
```

### 3. Deploy Contract

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Update `REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS` in `.env` with the deployed address.

### 4. Start Backend

```bash
npm run start:backend
```

Health check:

`http://127.0.0.1:3001/health`

Expected:

1. `status: ok`
2. `database: connected`

### 5. Start Frontend

```bash
npm start
```

App URL:

`http://localhost:3000`

## Typical User Flow

1. Connect wallet in frontend
2. Pick car, dates, and locations
3. Submit booking transaction in MetaMask
4. Booking saved on-chain and synced to Atlas
5. Verify data in:
   - Frontend booking history
   - `GET /api/local-bookings`
   - Atlas `car_rental_dapp.bookings`

## API Endpoints

1. `GET /health`
2. `GET /api/cars`
3. `GET /api/availability?carType=Toyota%20Corolla`
4. `GET /api/estimate?carType=Toyota%20Corolla&pickUpDate=1767225600&dropOffDate=1767398400&carCount=1`
5. `GET /api/reservations/0x<wallet_address>`
6. `GET /api/local-bookings`
7. `GET /api/local-bookings?walletAddress=0x<wallet_address>`
8. `POST /api/local-bookings`

## Quality Commands

```bash
npm run lint
npm run lint:fix
npm run test:contracts
npm run build
npm run quality
```

## Common Issues

1. `database: error` on `/health`:
   - Check Atlas URI
   - Check Atlas Network Access (IP allowlist)
   - Check DB username/password
2. `Insufficient funds` in booking:
   - Ensure Sepolia ETH balance is enough for rental + deposit + gas
3. Wrong network:
   - Switch MetaMask to Sepolia

## Security Notes

1. Never commit real `.env`
2. Use a test wallet for Sepolia
3. Rotate exposed private keys immediately

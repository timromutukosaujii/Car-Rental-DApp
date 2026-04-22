# Car Rental DApp

Hybrid DApp for car booking with:

1. Smart contract backend (`contracts/CarRental.sol`)
2. Node + MongoDB Atlas backend API (`backend/server.js`)
3. React frontend (`src/`)

## Project Structure

1. `contracts/` Solidity contract
2. `scripts/` deploy scripts
3. `test/CarRental.test.js` contract tests
4. `backend/` API server + Mongo model
5. `src/` frontend app

## Environment Setup

Create `.env` in project root:

```env
API_URL="https://eth-sepolia.g.alchemy.com/v2/<your_api_key>"
PRIVATE_KEY="<your_private_key>"
REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS="0x<deployed_contract_address>"
REACT_APP_BACKEND_URL="http://localhost:3001"
BACKEND_PORT=3001
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/car_rental_dapp?retryWrites=true&w=majority&appName=Cluster0"
MONGODB_DB_NAME="car_rental_dapp"
MONGODB_COLLECTION="bookings"
```

## Run the App

1. Install dependencies:

```bash
npm install
```

2. Deploy contract (Sepolia):

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

3. Start backend:

```bash
npm run start:backend
```

4. Start frontend:

```bash
npm start
```

Frontend: `http://localhost:3000`  
Backend health: `http://127.0.0.1:3001/health`

## Backend API

1. `GET /health`
2. `GET /api/cars`
3. `GET /api/availability?carType=Toyota%20Corolla`
4. `GET /api/estimate?carType=Toyota%20Corolla&pickUpDate=1767225600&dropOffDate=1767398400&carCount=1`
5. `GET /api/reservations/0x<wallet_address>`
6. `GET /api/local-bookings`
7. `GET /api/local-bookings?walletAddress=0x<wallet_address>`
8. `POST /api/local-bookings`

## Code Quality

ESLint covers frontend, backend, scripts, tests, and Hardhat config.

```bash
npm run lint
npm run lint:fix
```

Contract tests:

```bash
npm run test:contracts
```

Format:

```bash
npm run format
npm run format:check
```

Full quality gate:

```bash
npm run quality
```

## Quick Submission Evidence

1. `/health` returns `database: connected`
2. Booking transaction succeeds on Sepolia
3. Booking document appears in Atlas `car_rental_dapp.bookings`
4. `npm run quality` passes

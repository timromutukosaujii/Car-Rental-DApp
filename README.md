# Car Rental DApp

Simple car-rental decentralized app with 3 parts:
- Smart contract (`contracts/CarRental.sol`)
- Backend API (`backend/server.js`)
- React frontend (`src/`)

## Requirements
- Node.js 18+
- npm
- MongoDB Atlas connection string
- Sepolia RPC URL and wallet private key

## Setup
1. Install dependencies:
```bash
npm install
```

2. Create `.env` in the project root (you can copy from `.env.example`):
```env
API_URL="https://eth-sepolia.g.alchemy.com/v2/<your_key>"
PRIVATE_KEY="<your_private_key>"
REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS="0x<deployed_contract_address>"
REACT_APP_BACKEND_URL="http://localhost:3001"
BACKEND_PORT=3001
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/car_rental_dapp"
MONGODB_DB_NAME="car_rental_dapp"
MONGODB_COLLECTION="bookings"
```

## Run
1. Deploy contract:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

2. Start backend:
```bash
npm run start:backend
```

3. Start frontend:
```bash
npm start
```

App: `http://localhost:3000`
Backend health: `http://127.0.0.1:3001/health`

## Useful Commands
```bash
npm run test:contracts
npm run lint
npm run build
```

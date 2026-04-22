# Installation Manual: Car Rental DApp

## 1. Prerequisites

Install the following tools:

1. Node.js (LTS recommended)
2. npm (bundled with Node.js)
3. MetaMask browser extension
4. Git

Required blockchain setup:

1. MetaMask network set to **Sepolia**
2. Test ETH in your MetaMask account
3. RPC provider key (e.g., Alchemy/Infura)

## 2. Clone and Install

```bash
git clone https://github.com/timromutukosaujii/Car-Rental-DApp.git
cd Car-Rental-DApp
npm install
```

## 3. Configure Environment Variables

Create a `.env` file in project root:

```env
API_URL="https://eth-sepolia.g.alchemy.com/v2/<your_api_key>"
PRIVATE_KEY="<your_private_key_without_0x_or_with_0x>"
REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS="0x<contract_address_after_deploy>"
REACT_APP_BACKEND_URL="http://localhost:3001"
BACKEND_PORT="3001"
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority&appName=car-rental-dapp"
MONGODB_DB_NAME="car_rental_dapp"
MONGODB_COLLECTION="bookings"
```

Notes:

1. `PRIVATE_KEY` must be a 64-hex-character wallet key.
2. Use a test wallet only.
3. Do not share or commit `.env`.

## 4. Deploy Smart Contract

Compile + deploy to Sepolia:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:

```text
CarRental contract deployed to: 0x...
```

Copy that address into:

1. `.env` as `REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS`

## 5. Start Back End (Node API)

Before starting the backend, configure MongoDB Atlas:

1. Create an Atlas cluster.
2. Create a database user with read/write access.
3. Allow your current IP in Atlas Network Access.
4. Copy Atlas connection string and set `MONGODB_URI` in `.env`.
5. Confirm the target database name is `car_rental_dapp`.

Start the backend API in one terminal:

```bash
npm run start:backend
```

Default backend URL:

1. `http://localhost:3001`

Quick health check:

1. `http://localhost:3001/health`

Available read endpoints:

1. `GET /api/cars`
2. `GET /api/availability?carType=Toyota%20Corolla`
3. `GET /api/estimate?carType=Toyota%20Corolla&pickUpDate=1767225600&dropOffDate=1767398400&carCount=1`
4. `GET /api/reservations/0x<wallet_address>`
5. `GET /api/local-bookings`
6. `GET /api/local-bookings?walletAddress=0x<wallet_address>`

Write endpoint (stores personal + booking data in MongoDB):

1. `POST /api/local-bookings`

Stored dataset:

1. Database: `car_rental_dapp`
2. Collection: `bookings`

## 6. Start Front End

```bash
npm start
```

Open:

1. `http://localhost:3000`

## 7. Verify Application

1. Connect MetaMask wallet
2. Ensure network is Sepolia
3. Fill booking form and click `Search`
4. Complete reservation modal and submit transaction
5. Confirm transaction in MetaMask
6. Verify booking appears in Booking History

## 8. Code Quality Checks

Lint project:

```bash
npm run lint
```

Auto-fix lint issues:

```bash
npm run lint:fix
```

Run contract tests:

```bash
npm run test:contracts
```

Run all quality checks together:

```bash
npm run quality
```

## 9. Build for Submission

```bash
npm run build
```

## 10. Common Issues

1. **MetaMask not detected**: install/enable extension and refresh.
2. **Wrong network**: switch MetaMask to Sepolia.
3. **Transaction reverted**: check selected car availability and date range.
4. **Deployment fails**: verify `API_URL` and `PRIVATE_KEY` format in `.env`.
5. **Contract mismatch**: update `REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS` after redeploy.
6. **Backend config error**: ensure `.env` contains `API_URL`, `REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS`, and `MONGODB_URI`.
7. **Port already in use**: set `BACKEND_PORT` in `.env` and restart backend.
8. **MongoDB disconnected**: verify Atlas IP allowlist, DB username/password, and `MONGODB_URI` format.

## 11. Submission Checklist

1. Source code pushed to Git repository
2. Lint and build commands pass
3. Repository accessible to tutor/lecturer

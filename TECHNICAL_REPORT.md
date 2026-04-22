# Advanced Technical Report: Car Rental DApp

## 1. Introduction

This report evaluates the Car Rental DApp, an Ethereum-based decentralized application selected from an open-source software project workflow and developed using module-relevant technologies. The project demonstrates a full-stack DApp architecture with a Solidity smart contract back end, a React front end, and blockchain integration through Ethers.js and MetaMask on the Sepolia test network.

The project goal is to provide a transparent and trust-minimized vehicle booking process where core booking state is stored on-chain. This removes reliance on centralized back-end databases for booking records and introduces verifiable transaction history, deterministic booking logic, and wallet-based identity.

The implemented system supports:

1. Car booking with time range and quantity
2. Payment handling in ETH
3. Reservation lifecycle management (book/confirm/return/cancel)
4. Booking history retrieval for the connected wallet
5. Multi-car booking flow with simple planning support in the front end

This report critically analyzes architecture, implementation choices, blockchain interaction model, UI behavior, and code quality controls, mapped to the coursework marking scheme.

## 2. System Architecture

The DApp uses a layered architecture:

1. **Presentation layer (React)**: User-facing components in `src/components/`.
2. **Web3 integration layer (Ethers.js + MetaMask)**: Contract reads/writes from front end.
3. **Smart contract layer (Solidity)**: Booking rules and reservation state in `contracts/CarRental.sol`.
4. **Node backend layer**: REST API server with MongoDB Atlas persistence in `backend/server.js`.
5. **Deployment/config layer (Hardhat)**: Build and deployment scripts (`scripts/deploy.js`, `hardhat.config.js`).

The final architecture is hybrid:

1. Blockchain writes and authoritative reservation state are on-chain through signed wallet transactions.
2. Backend REST endpoints provide availability/cost/history reads and persist customer profile plus booking metadata for coursework evidence and admin-style retrieval.

## 3. Back-End Implementation (Smart Contract) [20 marks]

The contract-based back end is implemented in Solidity and defines domain entities and lifecycle controls:

1. `CarConfig`: Tracks car type availability, daily rate, and rented units.
2. `Reservation`: Tracks renter address, selected car type, date range, quantity, payment amounts, and status flags.

Core functions include:

1. `setCarConfig(...)`: Owner-only configuration for rate and unit count.
2. `getBookingCost(...)`: Deterministic cost calculation from date range and quantity.
3. `bookCar(...)`: Booking transaction with payment requirement checks.
4. `confirmReservation(...)`: Marks reservation as confirmed by renter.
5. `returnReservation(...)`: Returns deposit and updates rented unit counts.
6. `cancelReservation(...)`: Cancels pre-start bookings with refund logic.
7. `getCarAvailability(...)` and `getReservation(...)`: Query interfaces for UI and reporting.

Critical safety mechanisms:

1. Input validation (`require` checks) for date ranges, quantities, and IDs.
2. Ownership protection via `onlyOwner`.
3. Reentrancy guard (`nonReentrant`) around refund paths.
4. Booking state consistency checks for `rentedUnits`.

This structure is suitable for decentralized reservation logic because it enforces state transitions on-chain and prevents local tampering.

### Critical evaluation

Strengths:

1. Core business constraints are contract-enforced.
2. Refund and cancellation logic is explicit and auditable.
3. Event emissions support front-end feedback and future analytics.

Limitations:

1. Current model does not store multiple route/location entries on-chain per single booking transaction.
2. Iterative reservation retrieval from contract calls can become expensive in large histories without indexing.
3. Time granularity is day-level approximation in cost calculation logic.

## 4. Blockchain Interaction [20 marks]

Blockchain interaction is handled in React components using Ethers.js:

1. Wallet connection via MetaMask (`window.ethereum`).
2. Network validation against Sepolia chain ID (`11155111`).
3. Read calls: `getBookingCost`, `getReservation`, `reservationCount`, `getCarAvailability`.
4. Write calls: `bookCar` and lifecycle transactions.
5. Transaction receipt waiting (`await tx.wait()`) before success feedback.

The DApp uses environment-driven configuration for deployed contract addresses:

1. `REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS` for front-end contract resolution.
2. `API_URL` and `PRIVATE_KEY` for Hardhat deployment script execution.

### Critical evaluation

Strengths:

1. Real testnet transaction flow is fully functional (not mocked).
2. User identity is wallet-native and decentralized.
3. Contract ABI-driven interaction reduces manual encoding errors.

Limitations:

1. Network/RPC failures can degrade UX without retry strategy.
2. Sequential on-chain writes in multi-car planning increase latency and gas.
3. No indexer/subgraph is used, so history retrieval still relies on direct-contract iteration.

## 5. Front-End Implementation [20 marks]

The front end is implemented in React and includes:

1. Booking form with car type, locations, dates, and quantity.
2. Reservation modal for final confirmation and customer details.
3. Wallet connect status in navigation.
4. Booking history section showing on-chain reservations for current wallet.
5. Multi-car planner visible when quantity > 1, with per-plan location controls.

UX behavior includes:

1. Field-level validation with readable messages.
2. Success and error alerts tied to transaction outcomes.
3. Modal flow to separate search inputs from transaction confirmation.
4. Responsive layouts for form and history cards.

### Critical evaluation

Strengths:

1. Functional front-end/back-end integration under real wallet conditions.
2. Useful reservation history and state feedback.
3. Improved usability for multi-car flows through guided planning.

Limitations:

1. Some legacy DOM-style patterns were historically present and partially modernized.
2. Personal information is persisted in the backend datastore, but not on-chain by design for privacy and gas efficiency.
3. Multi-car plan submits as multiple transactions; one transaction can still fail after previous successes.

## 6. Code Quality and Version Control [10 marks]

The project demonstrates code quality and version control practices:

1. ESLint scripts defined in `package.json` (`lint`, `lint:fix`) and a combined quality workflow (`quality`).
2. Modular component structure in `src/components/`.
3. Environment validation in `hardhat.config.js`.
4. Contract-focused tests in `test/CarRental.test.js` covering booking lifecycle paths.
5. Git-based iterative commits and checkpointing workflow.
6. Prettier configuration for consistent formatting across the repository.

Recommended execution for quality verification:

1. `npm run lint`
2. `npm run test:contracts`
3. `npm run build`
4. `npm run quality`

Version control expectations are met by using a public/private hosted Git repository with commit history demonstrating progressive implementation and debugging.

### Critical evaluation

Strengths:

1. Reproducible local workflow with documented commands.
2. Clear division between contract, scripts, and UI layers.
3. Lint tooling provides baseline static quality checks.

Limitations and improvement plan:

1. Add automated CI pipeline for lint + build + tests on push.
2. Expand tests with additional edge cases and property-based input coverage.
3. Add pre-commit hooks for quality checks before local commits.

## 7. Installation and Deployment Summary

The full installation process is documented in `INSTALLATION_MANUAL.md`. The main sequence is:

1. Install dependencies (`npm install`).
2. Configure `.env` (`API_URL`, `PRIVATE_KEY`, deployed contract address).
3. Deploy contract to Sepolia (`npx hardhat run scripts/deploy.js --network sepolia`).
4. Start backend (`npm run start:backend`).
5. Start front end (`npm start`).

This provides a complete reproducible environment for lecturer/tutor verification.

## 8. Risks, Security, and Operational Notes

1. Private key exposure risk exists if `.env` is leaked; test wallet keys only should be used.
2. Contract upgrade/migration requires front-end address updates.
3. Refund paths require sufficient contract balance and robust testing.
4. Hybrid architecture depends on wallet/browser availability and backend uptime.

Mitigations:

1. Never commit `.env`.
2. Rotate compromised test keys immediately.
3. Add monitoring for failed transaction rates and revert reasons.

## 9. Conclusion

The Car Rental DApp provides a credible CN6035-aligned implementation of a decentralized mobile/distributed software system using Solidity, Hardhat, Ethers.js, and React. It demonstrates meaningful back-end smart contract logic, real blockchain testnet interaction, and a practical front-end user experience including booking, transaction processing, and history retrieval.

Against the marking sheet:

1. **Back-end implementation**: strong contract lifecycle and state management.
2. **Blockchain interaction**: complete wallet-based read/write testnet flow.
3. **Front-end implementation**: functional UI with booking lifecycle support.
4. **Code quality and version control**: lint tooling and Git-driven development.

Overall, the project satisfies the required DApp characteristics and is suitable for technical evaluation and demonstration in coursework assessment.

## 10. Fork Origin and Personal Contribution

This repository was initially forked from an open-source starter/foundation project. The submitted work extends and customizes that base substantially for CN6035 deliverables.

Main personal additions and changes include:

1. Solidity contract implementation and lifecycle logic in `contracts/CarRental.sol`.
2. Booking flow integration in `src/components/BookCar.jsx` with cost checks and transaction handling.
3. Wallet-linked booking history in `src/components/BookingHistory.jsx`.
4. Node backend implementation in `backend/server.js` with persistent MongoDB storage.
5. Coursework documentation updates in `INSTALLATION_MANUAL.md` and this technical report.

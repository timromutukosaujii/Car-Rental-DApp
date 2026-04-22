const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const { ethers } = require("ethers");
require("dotenv").config();

const PORT = Number(process.env.BACKEND_PORT || 3001);
const API_URL = process.env.API_URL;
const CONTRACT_ADDRESS = process.env.REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS;
const STORAGE_DIR = path.join(__dirname, "data");
const STORAGE_FILE = path.join(STORAGE_DIR, "bookings.json");
const MAX_BODY_BYTES = 1024 * 1024;

const ABI_PATH = path.join(__dirname, "..", "src", "ABI", "abi.json");
const carRentalAbi = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));

const CAR_TYPES = [
  "Audi A5 S-Line",
  "VW Arteon",
  "Toyota Corolla",
  "BMW 530",
  "Kia Sportage",
  "Mini Cooper",
  "Mercedes C-Class",
  "Range Rover",
  "BYD Atto 2",
];

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, statusCode, payload) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function normalizeAddress(address) {
  if (!address) return "";
  return String(address).toLowerCase();
}

function ensureStorage() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({ bookings: [] }, null, 2), "utf8");
  }
}

function readStorage() {
  ensureStorage();
  const raw = fs.readFileSync(STORAGE_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.bookings)) {
    throw new Error("Storage file is corrupted.");
  }
  return parsed;
}

function writeStorage(data) {
  ensureStorage();
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), "utf8");
}

function sanitizeText(value, maxLength = 200) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
        reject(new Error("Payload too large."));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        if (!body) {
          resolve({});
          return;
        }
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", () => {
      reject(new Error("Failed to read request body."));
    });
  });
}

function createReadContract() {
  if (!API_URL) {
    throw new Error("Missing API_URL in .env");
  }
  if (!CONTRACT_ADDRESS) {
    throw new Error("Missing REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS in .env");
  }
  const provider = new ethers.providers.JsonRpcProvider(API_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, carRentalAbi, provider);
}

async function handleCars(_req, res) {
  sendJson(res, 200, { cars: CAR_TYPES });
}

async function handleAvailability(req, res, contract) {
  const query = url.parse(req.url, true).query;
  const carType = String(query.carType || "").trim();

  if (!carType) {
    sendJson(res, 400, { error: "Missing required query parameter: carType" });
    return;
  }

  const [totalUnitsBn, rentedUnitsBn] = await contract.getCarAvailability(carType);
  const totalUnits = totalUnitsBn.toNumber();
  const rentedUnits = rentedUnitsBn.toNumber();

  sendJson(res, 200, {
    carType,
    totalUnits,
    rentedUnits,
    availableUnits: Math.max(totalUnits - rentedUnits, 0),
  });
}

async function handleEstimate(req, res, contract) {
  const query = url.parse(req.url, true).query;
  const carType = String(query.carType || "").trim();

  if (!carType) {
    sendJson(res, 400, { error: "Missing required query parameter: carType" });
    return;
  }

  try {
    const pickUpDate = parsePositiveInteger(query.pickUpDate, "pickUpDate");
    const dropOffDate = parsePositiveInteger(query.dropOffDate, "dropOffDate");
    const carCount = parsePositiveInteger(query.carCount, "carCount");

    const [rentalCostWei, depositWei, totalWei] = await contract.getBookingCost(
      carType,
      pickUpDate,
      dropOffDate,
      carCount
    );

    sendJson(res, 200, {
      carType,
      carCount,
      pickUpDate,
      dropOffDate,
      rentalCostWei: rentalCostWei.toString(),
      depositWei: depositWei.toString(),
      totalWei: totalWei.toString(),
      rentalCostEth: ethers.utils.formatEther(rentalCostWei),
      depositEth: ethers.utils.formatEther(depositWei),
      totalEth: ethers.utils.formatEther(totalWei),
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Unable to calculate estimate." });
  }
}

async function handleReservations(req, res, contract, walletAddress) {
  if (!ethers.utils.isAddress(walletAddress)) {
    sendJson(res, 400, { error: "walletAddress must be a valid Ethereum address." });
    return;
  }

  const totalReservations = (await contract.reservationCount()).toNumber();
  const targetWallet = normalizeAddress(walletAddress);
  const reservations = [];

  for (let id = totalReservations - 1; id >= 0; id -= 1) {
    const reservation = await contract.getReservation(id);
    const renter = normalizeAddress(reservation[0]);
    if (renter !== targetWallet) continue;

    const rentalCostWei = reservation[5];
    const depositWei = reservation[6];
    const totalPaidWei = rentalCostWei.add(depositWei);

    reservations.push({
      id,
      renter: reservation[0],
      carType: reservation[1],
      pickUpDate: reservation[2].toString(),
      dropOffDate: reservation[3].toString(),
      carCount: reservation[4].toString(),
      rentalCostWei: rentalCostWei.toString(),
      depositWei: depositWei.toString(),
      totalPaidWei: totalPaidWei.toString(),
      totalPaidEth: ethers.utils.formatEther(totalPaidWei),
      confirmed: reservation[7],
      returned: reservation[8],
    });
  }

  sendJson(res, 200, {
    walletAddress,
    total: reservations.length,
    reservations,
  });
}

async function handleCreateLocalBooking(req, res) {
  try {
    const body = await parseJsonBody(req);
    const walletAddress = sanitizeText(body.walletAddress, 42);

    if (!ethers.utils.isAddress(walletAddress)) {
      sendJson(res, 400, { error: "walletAddress must be a valid Ethereum address." });
      return;
    }

    const profile = {
      firstName: sanitizeText(body.profile?.firstName, 80),
      lastName: sanitizeText(body.profile?.lastName, 80),
      phone: sanitizeText(body.profile?.phone, 30),
      age: sanitizeText(body.profile?.age, 4),
      email: sanitizeText(body.profile?.email, 120),
      address: sanitizeText(body.profile?.address, 200),
      city: sanitizeText(body.profile?.city, 80),
      zipcode: sanitizeText(body.profile?.zipcode, 20),
    };

    const bookingPlan = Array.isArray(body.booking?.plan)
      ? body.booking.plan.map((item) => ({
          carType: sanitizeText(item.carType, 80),
          carCount: String(Number(item.carCount || 0)),
          pickUp: sanitizeText(item.pickUp, 80),
          dropOff: sanitizeText(item.dropOff, 80),
        }))
      : [];

    const txHashes = Array.isArray(body.blockchain?.txHashes)
      ? body.blockchain.txHashes.map((hash) => sanitizeText(hash, 80)).filter(Boolean)
      : [];

    if (!bookingPlan.length) {
      sendJson(res, 400, { error: "booking.plan must contain at least one item." });
      return;
    }

    const record = {
      id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      walletAddress,
      profile,
      booking: {
        carType: sanitizeText(body.booking?.carType, 80),
        pickUp: sanitizeText(body.booking?.pickUp, 80),
        dropOff: sanitizeText(body.booking?.dropOff, 80),
        pickUpDate: sanitizeText(body.booking?.pickUpDate, 30),
        dropOffDate: sanitizeText(body.booking?.dropOffDate, 30),
        carCount: String(Number(body.booking?.carCount || 0)),
        plan: bookingPlan,
      },
      blockchain: {
        chainId: Number(body.blockchain?.chainId || 0),
        contractAddress: sanitizeText(body.blockchain?.contractAddress, 42),
        txHashes,
      },
    };

    const storage = readStorage();
    storage.bookings.unshift(record);
    writeStorage(storage);

    sendJson(res, 201, {
      message: "Booking stored in backend database.",
      id: record.id,
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Unable to store booking." });
  }
}

async function handleLocalBookings(req, res) {
  const query = url.parse(req.url, true).query;
  const walletAddress = sanitizeText(query.walletAddress, 42);
  const storage = readStorage();

  let bookings = storage.bookings;
  if (walletAddress) {
    if (!ethers.utils.isAddress(walletAddress)) {
      sendJson(res, 400, { error: "walletAddress must be a valid Ethereum address." });
      return;
    }
    bookings = bookings.filter(
      (item) => normalizeAddress(item.walletAddress) === normalizeAddress(walletAddress)
    );
  }

  sendJson(res, 200, {
    total: bookings.length,
    bookings,
  });
}

async function routeRequest(req, res) {
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname || "/";

  if (pathname === "/health") {
    let localBookingCount = 0;
    try {
      const storage = readStorage();
      localBookingCount = storage.bookings.length;
    } catch {
      localBookingCount = 0;
    }
    sendJson(res, 200, {
      status: "ok",
      service: "car-rental-backend",
      contractAddress: CONTRACT_ADDRESS || null,
      localBookingCount,
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/local-bookings") {
    await handleCreateLocalBooking(req, res);
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed. Use GET for this route." });
    return;
  }

  if (pathname === "/api/cars") {
    await handleCars(req, res);
    return;
  }

  if (pathname === "/api/local-bookings") {
    await handleLocalBookings(req, res);
    return;
  }

  let contract;
  try {
    contract = createReadContract();
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Backend configuration error." });
    return;
  }

  try {
    if (pathname === "/api/availability") {
      await handleAvailability(req, res, contract);
      return;
    }

    if (pathname === "/api/estimate") {
      await handleEstimate(req, res, contract);
      return;
    }

    const reservationMatch = pathname.match(/^\/api\/reservations\/(0x[a-fA-F0-9]{40})$/);
    if (reservationMatch) {
      await handleReservations(req, res, contract, reservationMatch[1]);
      return;
    }

    sendJson(res, 404, { error: "Route not found." });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Unexpected backend error." });
  }
}

const server = http.createServer((req, res) => {
  routeRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`Car Rental backend running on http://localhost:${PORT}`);
});

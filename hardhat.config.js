/**
* @type import('hardhat/config').HardhatUserConfig
*/

require('dotenv').config();
require("@nomiclabs/hardhat-ethers");

const { API_URL, PRIVATE_KEY } = process.env;

function getValidatedEnv() {
  const apiUrl = (API_URL || "").trim();
  const rawKey = (PRIVATE_KEY || "").trim();
  const normalizedKey = rawKey.startsWith("0x") ? rawKey.slice(2) : rawKey;

  if (!apiUrl) {
    throw new Error(
      "Missing API_URL in .env. Expected: API_URL=\"https://eth-sepolia.g.alchemy.com/v2/<key>\""
    );
  }

  if (!/^https?:\/\/\S+$/i.test(apiUrl)) {
    throw new Error("Invalid API_URL in .env. It must be a full http(s) URL.");
  }

  if (!normalizedKey) {
    throw new Error(
      "Missing PRIVATE_KEY in .env. Expected a 64-character hex private key (without 0x)."
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(normalizedKey)) {
    throw new Error(
      `Invalid PRIVATE_KEY in .env. Expected exactly 64 hex characters (32 bytes), received length ${normalizedKey.length}.`
    );
  }

  return { apiUrl, privateKey: `0x${normalizedKey}` };
}

const { apiUrl, privateKey } = getValidatedEnv();

module.exports = {
  solidity: "0.8.9",
  networks: {
    sepolia: {
      url: apiUrl,
      accounts: [privateKey]
    },
  },
}

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../ABI/abi.json";

const contractAddress =
  process.env.REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS ||
  "0x8d1aD974F97AE8671E8F345f254a5CFD22CE21BF";
const sepoliaChainId = 11155111;

const formatDate = (unixSeconds) => {
  const date = new Date(Number(unixSeconds) * 1000);
  return date.toLocaleDateString("en-GB");
};

const shortAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

function BookingHistory() {
  const [walletAddress, setWalletAddress] = useState("");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    setError("");
    setLoading(true);

    try {
      if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
        setReservations([]);
        setError("MetaMask not detected.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== sepoliaChainId) {
        setReservations([]);
        setError("Switch MetaMask to Sepolia to view booking history.");
        return;
      }

      const accounts = await provider.send("eth_accounts", []);
      if (!accounts.length) {
        setWalletAddress("");
        setReservations([]);
        setError("Connect your wallet to load booking history.");
        return;
      }

      const account = accounts[0].toLowerCase();
      setWalletAddress(accounts[0]);

      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const totalReservations = (await contract.reservationCount()).toNumber();
      const history = [];

      for (let id = totalReservations - 1; id >= 0; id -= 1) {
        const reservation = await contract.getReservation(id);
        const renter = String(reservation[0]).toLowerCase();
        if (renter !== account) continue;

        const rentalCostWei = reservation[5];
        const depositWei = reservation[6];
        const totalPaidWei = rentalCostWei.add(depositWei);

        history.push({
          id,
          renter: reservation[0],
          carType: reservation[1],
          pickUpDate: reservation[2],
          dropOffDate: reservation[3],
          carCount: reservation[4].toString(),
          totalPaidEth: Number(ethers.utils.formatEther(totalPaidWei)).toFixed(4),
          confirmed: reservation[7],
          returned: reservation[8],
        });
      }

      setReservations(history);
    } catch (err) {
      console.error("Failed to load booking history:", err);
      setReservations([]);
      setError("Unable to load booking history right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();

    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = () => {
        loadHistory();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleAccountsChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleAccountsChanged);
      };
    }

    return undefined;
  }, []);

  return (
    <section className="booking-history-section">
      <div className="container">
        <div className="booking-history">
          <div className="booking-history__head">
            <h2>Booking History</h2>
            <button type="button" onClick={loadHistory}>
              Refresh
            </button>
          </div>

          {walletAddress && (
            <p className="booking-history__wallet">
              Wallet: {shortAddress(walletAddress)}
            </p>
          )}

          {loading && <p className="booking-history__state">Loading history...</p>}
          {!loading && error && <p className="booking-history__state error">{error}</p>}
          {!loading && !error && reservations.length === 0 && (
            <p className="booking-history__state">No bookings found for this wallet.</p>
          )}

          {!loading && !error && reservations.length > 0 && (
            <div className="booking-history__grid">
              {reservations.map((item) => (
                <article key={item.id} className="booking-history__card">
                  <div className="booking-history__row">
                    <span>Reservation ID</span>
                    <strong>#{item.id}</strong>
                  </div>
                  <div className="booking-history__row">
                    <span>Car</span>
                    <strong>{item.carType}</strong>
                  </div>
                  <div className="booking-history__row">
                    <span>Cars</span>
                    <strong>{item.carCount}</strong>
                  </div>
                  <div className="booking-history__row">
                    <span>Pick-up</span>
                    <strong>{formatDate(item.pickUpDate)}</strong>
                  </div>
                  <div className="booking-history__row">
                    <span>Drop-off</span>
                    <strong>{formatDate(item.dropOffDate)}</strong>
                  </div>
                  <div className="booking-history__row">
                    <span>Total paid</span>
                    <strong>{item.totalPaidEth} ETH</strong>
                  </div>
                  <div className="booking-history__row">
                    <span>Status</span>
                    <strong>{item.returned ? "Closed" : item.confirmed ? "Confirmed" : "Booked"}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default BookingHistory;

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../ABI/abi.json";
import BookingForm from "./bookcar/BookingForm";
import BookingModal from "./bookcar/BookingModal";
import {
  BACKEND_BASE_URL,
  CAR_IMAGE_BY_TYPE,
  CAR_TYPES,
  CONTRACT_ADDRESS,
  LOCATIONS,
  SEPOLIA_CHAIN_ID,
} from "./bookcar/constants";
import {
  buildInitialPlan,
  buildSuggestedSplitPlan,
  getReadableErrorMessage,
} from "./bookcar/utils";

const INITIAL_FORM_STATE = {
  carType: "",
  pickUp: "",
  dropOff: "",
  pickTime: "",
  dropTime: "",
  carCount: "1",
};

const INITIAL_PROFILE_STATE = {
  name: "",
  lastName: "",
  phone: "",
  age: "",
  email: "",
  address: "",
  city: "",
  postcode: "",
};

function BookCar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [profile, setProfile] = useState(INITIAL_PROFILE_STATE);
  const [bookingPlan, setBookingPlan] = useState([]);
  const [formErrorMessage, setFormErrorMessage] = useState("");
  const [formInfoMessage, setFormInfoMessage] = useState("");
  const [modalErrorMessage, setModalErrorMessage] = useState("");
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState("");

  const carImageUrl = useMemo(
    () => CAR_IMAGE_BY_TYPE[formData.carType] || "",
    [formData.carType]
  );

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
  }, [isModalOpen]);

  const clearMessages = () => {
    setFormErrorMessage("");
    setFormInfoMessage("");
    setBookingSuccessMessage("");
  };

  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "carCount" && Number(value) <= 1) {
      setBookingPlan([]);
    }
    clearMessages();
  };

  const updateProfileField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setModalErrorMessage("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalErrorMessage("");
  };

  const getReadContract = async () => {
    if (typeof window === "undefined" || typeof window.ethereum === "undefined") return null;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    if (network.chainId !== SEPOLIA_CHAIN_ID) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
  };

  const getAvailabilityMap = async () => {
    const contract = await getReadContract();
    if (!contract) return null;

    const entries = await Promise.all(
      CAR_TYPES.map(async (type) => {
        const [totalUnitsBn, rentedUnitsBn] = await contract.getCarAvailability(type);
        const available = Math.max(totalUnitsBn.toNumber() - rentedUnitsBn.toNumber(), 0);
        return [type, available];
      })
    );

    return Object.fromEntries(entries);
  };

  const estimateTotalEth = async (type, pickupSeconds, dropoffSeconds, count) => {
    const contract = await getReadContract();
    if (!contract) return null;
    const [, , totalWei] = await contract.getBookingCost(type, pickupSeconds, dropoffSeconds, count);
    return Number(ethers.utils.formatEther(totalWei)).toFixed(4);
  };

  const persistBookingToBackend = async ({ walletAddress, chainId, plan, txHashes }) => {
    const payload = {
      walletAddress,
      profile: {
        firstName: profile.name,
        lastName: profile.lastName,
        phone: profile.phone,
        age: profile.age,
        email: profile.email,
        address: profile.address,
        city: profile.city,
        postcode: profile.postcode,
      },
      booking: {
        carType: formData.carType,
        pickUp: formData.pickUp,
        dropOff: formData.dropOff,
        pickUpDate: formData.pickTime,
        dropOffDate: formData.dropTime,
        carCount: formData.carCount,
        plan,
      },
      blockchain: {
        chainId,
        contractAddress: CONTRACT_ADDRESS,
        txHashes,
      },
    };

    const response = await fetch(`${BACKEND_BASE_URL}/api/local-bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseBody = await response.json().catch(() => ({}));
      throw new Error(responseBody.error || "Backend storage failed.");
    }
  };

  const openModal = async (event) => {
    event.preventDefault();
    const parsedCarCount = Number(formData.carCount);
    const pickDate = new Date(formData.pickTime);
    const dropDate = new Date(formData.dropTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      !formData.pickUp ||
      !formData.dropOff ||
      !formData.pickTime ||
      !formData.dropTime ||
      !formData.carType
    ) {
      setFormErrorMessage("Missing field");
      return;
    }

    if (Number.isNaN(parsedCarCount) || parsedCarCount <= 0) {
      setFormErrorMessage("Car count must be at least 1");
      return;
    }

    if (pickDate >= dropDate || pickDate < today) {
      setFormErrorMessage("Invalid date range");
      return;
    }

    if (parsedCarCount > 1) {
      setBookingPlan(
        buildInitialPlan(
          formData.carType,
          parsedCarCount,
          formData.pickUp,
          formData.dropOff
        )
      );
    } else {
      setBookingPlan([]);
    }
    setFormInfoMessage("");

    if (parsedCarCount > 1) {
      try {
        const availabilityMap = await getAvailabilityMap();
        const pickUpDateInSeconds = Math.floor(pickDate.getTime() / 1000);
        const dropOffDateInSeconds = Math.floor(dropDate.getTime() / 1000);

        if (availabilityMap) {
          const selectedAvailable = availabilityMap[formData.carType] || 0;
          const totalAvailable = Object.values(availabilityMap).reduce(
            (sum, val) => sum + val,
            0
          );

          if (selectedAvailable >= parsedCarCount) {
            const sameTypeCost = await estimateTotalEth(
              formData.carType,
              pickUpDateInSeconds,
              dropOffDateInSeconds,
              parsedCarCount
            );
            if (sameTypeCost) {
              setFormInfoMessage(
                `Same-type booking available: ${parsedCarCount} x ${formData.carType} (est. ${sameTypeCost} ETH total).`
              );
            }
          } else if (totalAvailable >= parsedCarCount) {
            const { plan } = buildSuggestedSplitPlan(
              formData.carType,
              parsedCarCount,
              formData.pickUp,
              formData.dropOff,
              availabilityMap,
              CAR_TYPES
            );
            if (plan.length > 0) {
              setBookingPlan(plan);
              setFormInfoMessage(
                `Suggested split based on availability: ${plan
                  .map((item) => `${item.carCount} x ${item.carType}`)
                  .join(" + ")}`
              );
            }
          } else {
            setFormErrorMessage(
              `Only ${totalAvailable} car(s) currently available across all types.`
            );
            return;
          }
        }
      } catch (error) {
        console.error("Suggestion lookup failed:", error);
      }
    }

    setFormErrorMessage("");
    setModalErrorMessage("");
    setIsModalOpen(true);
    const modalDiv = document.querySelector(".booking-modal");
    modalDiv?.scroll(0, 0);
  };

  const updatePlanItem = (index, field, value) => {
    setBookingPlan((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
    setModalErrorMessage("");
  };

  const validateProfile = () =>
    Object.values(profile).every((value) => String(value || "").trim() !== "");

  const confirmBooking = async (event) => {
    event.preventDefault();

    if (!validateProfile()) {
      setModalErrorMessage("Missing field");
      return;
    }

    try {
      if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not available in this browser.");
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        throw new Error("Please switch MetaMask to the Sepolia network.");
      }

      const signer = provider.getSigner();
      const carRentalContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      const walletAddress = await signer.getAddress();

      const pickUpDateInSeconds = Math.floor(new Date(formData.pickTime).getTime() / 1000);
      const dropOffDateInSeconds = Math.floor(new Date(formData.dropTime).getTime() / 1000);
      const parsedCarCount = Number(formData.carCount);
      if (Number.isNaN(parsedCarCount) || parsedCarCount <= 0) {
        throw new Error("Car count must be at least 1");
      }

      const finalPlan = bookingPlan.length
        ? bookingPlan
        : buildInitialPlan(
            formData.carType,
            parsedCarCount,
            formData.pickUp,
            formData.dropOff
          );

      const plannedTotal = finalPlan.reduce(
        (sum, item) => sum + Number(item.carCount || 0),
        0
      );
      if (plannedTotal !== parsedCarCount) {
        throw new Error("Plan car counts must match Number of Cars.");
      }

      const txHashes = [];
      const shortHashes = [];
      for (const item of finalPlan) {
        const itemCount = Number(item.carCount);
        if (!item.carType || Number.isNaN(itemCount) || itemCount <= 0) {
          throw new Error("Each booking plan row needs a valid car type and count.");
        }
        if (!item.pickUp || !item.dropOff) {
          throw new Error("Each booking plan row needs pick-up and drop-off location.");
        }

        const [, , totalWei] = await carRentalContract.getBookingCost(
          item.carType,
          pickUpDateInSeconds,
          dropOffDateInSeconds,
          itemCount
        );

        const transaction = await carRentalContract.bookCar(
          item.carType,
          pickUpDateInSeconds,
          dropOffDateInSeconds,
          itemCount,
          { value: totalWei }
        );

        await transaction.wait();
        txHashes.push(transaction.hash);
        shortHashes.push(`${transaction.hash.slice(0, 10)}...`);
      }

      try {
        await persistBookingToBackend({
          walletAddress,
          chainId: network.chainId,
          plan: finalPlan,
          txHashes,
        });
      } catch (storageError) {
        console.error("Backend storage error:", storageError);
        setFormInfoMessage("Booking succeeded on blockchain, but backend storage was unavailable.");
      }

      setIsModalOpen(false);
      setModalErrorMessage("");
      setFormErrorMessage("");
      setFormInfoMessage("");
      setBookingSuccessMessage(
        `Booked ${parsedCarCount} car(s) in ${finalPlan.length} booking(s). Tx: ${shortHashes.join(", ")}`
      );
    } catch (error) {
      console.error("Payment error:", error);
      setModalErrorMessage(getReadableErrorMessage(error));
    }
  };

  return (
    <>
      <section id="booking-section" className="book-section">
        <div
          onClick={closeModal}
          className={`modal-overlay ${isModalOpen ? "active-modal" : ""}`}
        ></div>

        <div className="container">
          <div className="book-content">
            <BookingForm
              formData={formData}
              carTypes={CAR_TYPES}
              locations={LOCATIONS}
              formErrorMessage={formErrorMessage}
              formInfoMessage={formInfoMessage}
              bookingSuccessMessage={bookingSuccessMessage}
              clearFormError={() => setFormErrorMessage("")}
              clearFormInfo={() => setFormInfoMessage("")}
              clearBookingSuccess={() => setBookingSuccessMessage("")}
              onFieldChange={updateFormField}
              onSearch={openModal}
            />
          </div>
        </div>
      </section>

      <BookingModal
        isOpen={isModalOpen}
        formData={formData}
        carImgUrl={carImageUrl}
        bookingPlan={bookingPlan}
        carTypes={CAR_TYPES}
        locations={LOCATIONS}
        modalErrorMessage={modalErrorMessage}
        profile={profile}
        onClose={closeModal}
        onClearModalError={() => setModalErrorMessage("")}
        onPlanItemChange={updatePlanItem}
        onProfileFieldChange={updateProfileField}
        onConfirm={confirmBooking}
      />
    </>
  );
}

export default BookCar;

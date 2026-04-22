import { useEffect, useState } from "react";
import { ethers } from "ethers";
import CarAudi from "../images/cars-big/audi-box.png";
import CarVW from "../images/cars-big/arteon-box.jpg";
import CarToyota from "../images/cars-big/corolla-box.png";
import CarBmw from "../images/cars-big/bmw-box.png";
import CarKia from "../images/cars-big/sportage-box.png";
import CarMini from "../images/cars-big/mini-box.png";
import CarMercedes from "../images/cars-big/mercedes-cclass.png";
import CarRangeRover from "../images/cars-big/range-rover.png";
import CarByd from "../images/cars-big/byd-atto2.png";


import contractABI from '../ABI/abi.json';
const contractAddress =
  process.env.REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS ||
  "0x8d1aD974F97AE8671E8F345f254a5CFD22CE21BF";
const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";
const sepoliaChainId = 11155111;
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
const LOCATIONS = ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Bristol"];

function BookCar() {
  const [modal, setModal] = useState(false);
  // booking car
  const [carType, setCarType] = useState("");
  const [pickUp, setPickUp] = useState("");
  const [dropOff, setDropOff] = useState("");
  const [pickTime, setPickTime] = useState("");
  const [dropTime, setDropTime] = useState("");
  const [carCount, setCarCount] = useState("1");
  const [carImg, setCarImg] = useState("");
  const [formErrorMessage, setFormErrorMessage] = useState("");
  const [formInfoMessage, setFormInfoMessage] = useState("");
  const [modalErrorMessage, setModalErrorMessage] = useState("");
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState("");
  const [bookingPlan, setBookingPlan] = useState([]);

  // modal infos
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipcode, setZipCode] = useState("");

  // taking value of modal inputs
  const handleName = (e) => {
    setName(e.target.value);
    setModalErrorMessage("");
  };

  const handleLastName = (e) => {
    setLastName(e.target.value);
    setModalErrorMessage("");
  };

  const handlePhone = (e) => {
    setPhone(e.target.value);
    setModalErrorMessage("");
  };

  const handleAge = (e) => {
    setAge(e.target.value);
    setModalErrorMessage("");
  };

  const handleEmail = (e) => {
    setEmail(e.target.value);
    setModalErrorMessage("");
  };

  const handleAddress = (e) => {
    setAddress(e.target.value);
    setModalErrorMessage("");
  };

  const handleCity = (e) => {
    setCity(e.target.value);
    setModalErrorMessage("");
  };

  const handleZip = (e) => {
    setZipCode(e.target.value);
    setModalErrorMessage("");
  };

  const getReadableErrorMessage = (error) => {
    const rawMessage =
      error?.reason ||
      error?.data?.message ||
      error?.error?.message ||
      error?.message ||
      "Payment failed";

    return rawMessage
      .replace(/^execution reverted:\s*/i, "")
      .replace(/^Error:\s*/i, "");
  };

  const persistBookingToBackend = async ({
    walletAddress,
    chainId,
    plan,
    txHashes,
  }) => {
    const payload = {
      walletAddress,
      profile: {
        firstName: name,
        lastName,
        phone,
        age,
        email,
        address,
        city,
        zipcode,
      },
      booking: {
        carType,
        pickUp,
        dropOff,
        pickUpDate: pickTime,
        dropOffDate: dropTime,
        carCount,
        plan,
      },
      blockchain: {
        chainId,
        contractAddress,
        txHashes,
      },
    };

    const response = await fetch(`${backendBaseUrl}/api/local-bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseBody = await response.json().catch(() => ({}));
      throw new Error(responseBody.error || "Backend storage failed.");
    }
  };

  const closeModal = () => {
    setModal(false);
    setModalErrorMessage("");
  };

  const getReadContract = async () => {
    if (typeof window === "undefined" || typeof window.ethereum === "undefined") return null;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    if (network.chainId !== sepoliaChainId) return null;
    return new ethers.Contract(contractAddress, contractABI, provider);
  };

  const buildInitialPlan = (selectedType, totalCount, selectedPick, selectedDrop) => [
    {
      carType: selectedType,
      carCount: String(totalCount),
      pickUp: selectedPick,
      dropOff: selectedDrop,
    },
  ];

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

  const buildSuggestedSplitPlan = (selectedType, totalCount, selectedPick, selectedDrop, availabilityMap) => {
    const remainingPlan = [];
    let remaining = totalCount;

    const selectedAvailable = availabilityMap[selectedType] || 0;
    if (selectedAvailable > 0) {
      const take = Math.min(selectedAvailable, remaining);
      remainingPlan.push({
        carType: selectedType,
        carCount: String(take),
        pickUp: selectedPick,
        dropOff: selectedDrop,
      });
      remaining -= take;
    }

    const fallbackTypes = CAR_TYPES.filter((type) => type !== selectedType)
      .map((type) => ({ type, available: availabilityMap[type] || 0 }))
      .filter((item) => item.available > 0)
      .sort((a, b) => b.available - a.available);

    for (const item of fallbackTypes) {
      if (remaining <= 0) break;
      const take = Math.min(item.available, remaining);
      remainingPlan.push({
        carType: item.type,
        carCount: String(take),
        pickUp: selectedPick,
        dropOff: selectedDrop,
      });
      remaining -= take;
    }

    return { plan: remainingPlan, remaining };
  };

  const handlePlanItemChange = (index, field, value) => {
    setBookingPlan((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
    setModalErrorMessage("");
  };

  // open modal when all inputs are fulfilled
  const openModal = async (e) => {
    e.preventDefault();
    const parsedCarCount = Number(carCount);
    const pickDate = new Date(pickTime);
    const dropDate = new Date(dropTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      pickUp === "" ||
      dropOff === "" ||
      pickTime === "" ||
      dropTime === "" ||
      carType === ""
    ) {
      setFormErrorMessage("Missing field");
    } else if (Number.isNaN(parsedCarCount) || parsedCarCount <= 0) {
      setFormErrorMessage("Car count must be at least 1");
    } else if (pickDate >= dropDate || pickDate < today) {
      setFormErrorMessage("Invalid date range");
    } else {
      if (parsedCarCount > 1) {
        const defaultPlan = buildInitialPlan(carType, parsedCarCount, pickUp, dropOff);
        setBookingPlan(defaultPlan);
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
            const selectedAvailable = availabilityMap[carType] || 0;
            const totalAvailable = Object.values(availabilityMap).reduce((sum, val) => sum + val, 0);

            if (selectedAvailable >= parsedCarCount) {
              const sameTypeCost = await estimateTotalEth(
                carType,
                pickUpDateInSeconds,
                dropOffDateInSeconds,
                parsedCarCount
              );
              if (sameTypeCost) {
                setFormInfoMessage(
                  `Same-type booking available: ${parsedCarCount} x ${carType} (est. ${sameTypeCost} ETH total).`
                );
              }
            } else if (totalAvailable >= parsedCarCount) {
              const { plan } = buildSuggestedSplitPlan(
                carType,
                parsedCarCount,
                pickUp,
                dropOff,
                availabilityMap
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
      setModal(true);
      const modalDiv = document.querySelector(".booking-modal");
      modalDiv.scroll(0, 0);
    }
  };

  // disable page scroll when modal is displayed
  useEffect(() => {
    if (modal === true) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [modal]);

  // confirm modal booking
  const confirmBooking = async (e) => {
    e.preventDefault();
    if (
      name === "" ||
      lastName === "" ||
      phone === "" ||
      age === "" ||
      email === "" ||
      address === "" ||
      city === "" ||
      zipcode === ""
    ) {
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

      if (network.chainId !== sepoliaChainId) {
        throw new Error("Please switch MetaMask to the Sepolia network.");
      }

      const signer = provider.getSigner();
      const carRentalContract = new ethers.Contract(contractAddress, contractABI, signer);
      const walletAddress = await signer.getAddress();

      const pickUpDateInSeconds = Math.floor(new Date(pickTime).getTime() / 1000);
      const dropOffDateInSeconds = Math.floor(new Date(dropTime).getTime() / 1000);
      const parsedCarCount = Number(carCount);
      if (Number.isNaN(parsedCarCount) || parsedCarCount <= 0) throw new Error("Car count must be at least 1");

      const finalPlan = bookingPlan.length
        ? bookingPlan
        : buildInitialPlan(carType, parsedCarCount, pickUp, dropOff);

      const plannedTotal = finalPlan.reduce((sum, item) => sum + Number(item.carCount || 0), 0);
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

      setModal(false);
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
  

  // taking value of booking inputs
  const handleCar = (e) => {
    setCarType(e.target.value);
    setCarImg(e.target.value);
    setFormErrorMessage("");
    setFormInfoMessage("");
    setBookingSuccessMessage("");
  };

  const handlePick = (e) => {
    setPickUp(e.target.value);
    setFormErrorMessage("");
    setFormInfoMessage("");
    setBookingSuccessMessage("");
  };

  const handleDrop = (e) => {
    setDropOff(e.target.value);
    setFormErrorMessage("");
    setFormInfoMessage("");
    setBookingSuccessMessage("");
  };

  const handlePickTime = (e) => {
    setPickTime(e.target.value);
    setFormErrorMessage("");
    setFormInfoMessage("");
    setBookingSuccessMessage("");
  };

  const handleDropTime = (e) => {
    setDropTime(e.target.value);
    setFormErrorMessage("");
    setFormInfoMessage("");
    setBookingSuccessMessage("");
  };

  const handleCarCount = (e) => {
    const nextValue = e.target.value;
    setCarCount(nextValue);
    if (Number(nextValue) <= 1) {
      setBookingPlan([]);
    }
    setFormErrorMessage("");
    setFormInfoMessage("");
    setBookingSuccessMessage("");
  };

  // based on value name show car img
  let imgUrl;
  switch (carImg) {
    case "Audi A5 S-Line":
      imgUrl = CarAudi;
      break;
    case "VW Arteon":
      imgUrl = CarVW;
      break;
    case "Toyota Corolla":
      imgUrl = CarToyota;
      break;
    case "BMW 530":
      imgUrl = CarBmw;
      break;
    case "Kia Sportage":
      imgUrl = CarKia;
      break;
    case "Mini Cooper":
      imgUrl = CarMini;
      break;
    case "Mercedes C-Class":
      imgUrl = CarMercedes;
      break;
    case "Range Rover":
      imgUrl = CarRangeRover;
      break;
    case "BYD Atto 2":
      imgUrl = CarByd;
      break;
    default:
      imgUrl = "";
  }

  // hide message
  const hideMessage = () => {
    setBookingSuccessMessage("");
  };

  return (
    <>
      <section id="booking-section" className="book-section">
        {/* overlay */}
        <div
          onClick={closeModal}
          className={`modal-overlay ${modal ? "active-modal" : ""}`}
        ></div>

        <div className="container">
          <div className="book-content">
            <div className="book-content__box">
              <h2>Book a car</h2>

              {formErrorMessage && (
                <p className="error-message">
                  {formErrorMessage}
                  <i onClick={() => setFormErrorMessage("")} className="fa-solid fa-xmark"></i>
                </p>
              )}

              {bookingSuccessMessage && (
                <p className="booking-done">
                  {bookingSuccessMessage}
                  <i onClick={hideMessage} className="fa-solid fa-xmark"></i>
                </p>
              )}
              {formInfoMessage && (
                <p className="booking-info">
                  {formInfoMessage}
                  <i onClick={() => setFormInfoMessage("")} className="fa-solid fa-xmark"></i>
                </p>
              )}

              <form className="box-form">
                <div className="box-form__car-type">
                  <label>
                    <i className="fa-solid fa-car"></i> &nbsp; Select Your Car
                    Type <b>*</b>
                  </label>
                  <select value={carType} onChange={handleCar}>
                    <option value="">Select your car type</option>
                    <option value="Audi A5 S-Line">Audi A5 S-Line</option>
                    <option value="VW Arteon">VW Arteon</option>
                    <option value="Toyota Corolla">Toyota Corolla</option>
                    <option value="BMW 530">
                      BMW 530
                    </option>
                    <option value="Kia Sportage">Kia Sportage</option>
                    <option value="Mini Cooper">Mini Cooper</option>
                    <option value="Mercedes C-Class">Mercedes C-Class</option>
                    <option value="Range Rover">Range Rover</option>
                    <option value="BYD Atto 2">BYD Atto 2</option>
                  </select>
                </div>

                <div className="box-form__car-type">
                  <label>
                    <i className="fa-solid fa-location-dot"></i> &nbsp; Pick-up{" "}
                    <b>*</b>
                  </label>
                  <select value={pickUp} onChange={handlePick}>
                    <option value="">Select pick up location</option>
                    <option>London</option>
                    <option>Manchester</option>
                    <option>Birmingham</option>
                    <option>Liverpool</option>
                    <option>Leeds</option>
                    <option>Bristol</option>
                  </select>
                </div>

                <div className="box-form__car-type">
                  <label>
                    <i className="fa-solid fa-location-dot"></i> &nbsp; Drop-of{" "}
                    <b>*</b>
                  </label>
                  <select value={dropOff} onChange={handleDrop}>
                    <option value="">Select drop off location</option>
                    <option>London</option>
                    <option>Manchester</option>
                    <option>Birmingham</option>
                    <option>Liverpool</option>
                    <option>Leeds</option>
                    <option>Bristol</option>
                  </select>
                </div>

                <div className="box-form__car-time">
                  <label htmlFor="picktime">
                    <i className="fa-regular fa-calendar-days "></i> &nbsp;
                    Pick-up <b>*</b>
                  </label>
                  <input
                    id="picktime"
                    value={pickTime}
                    onChange={handlePickTime}
                    type="date"
                  ></input>
                </div>

                <div className="box-form__car-time">
                  <label htmlFor="droptime">
                    <i className="fa-regular fa-calendar-days "></i> &nbsp;
                    Drop-of <b>*</b>
                  </label>
                  <input
                    id="droptime"
                    value={dropTime}
                    onChange={handleDropTime}
                    type="date"
                  ></input>
                </div>

                <div className="box-form__car-time">
                  <label htmlFor="carcount">
                    <i className="fa-solid fa-hashtag"></i> &nbsp;
                    Number of Cars <b>*</b>
                  </label>
                  <input
                    id="carcount"
                    value={carCount}
                    onChange={handleCarCount}
                    type="number"
                    min="1"
                    step="1"
                  ></input>
                </div>

                <button onClick={openModal} type="submit">
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* modal ------------------------------------ */}

      <div className={`booking-modal ${modal ? "active-modal" : ""}`}>
        {/* title */}
        <div className="booking-modal__title">
          <h2>Complete Reservation</h2>
          <i onClick={closeModal} className="fa-solid fa-xmark"></i>
        </div>
  
        {/* car info */}
        <div className="booking-modal__car-info">
          <div className="dates-div">
            <div className="booking-modal__car-info__dates">
              <h5>Location & Date</h5>
              <span>
                <i className="fa-solid fa-location-dot"></i>
                <div>
                  <h6>Pick-Up Date & Time</h6>
                  <p>
                    {pickTime} /{" "}
                    <input type="time" className="input-time"></input>
                  </p>
                </div>
              </span>
            </div>

            <div className="booking-modal__car-info__dates">
              <span>
                <i className="fa-solid fa-location-dot"></i>
                <div>
                  <h6>Drop-Off Date & Time</h6>
                  <p>
                    {dropTime} /{" "}
                    <input type="time" className="input-time"></input>
                  </p>
                </div>
              </span>
            </div>

            <div className="booking-modal__car-info__dates">
              <span>
                <i className="fa-solid fa-calendar-days"></i>
                <div>
                  <h6>Pick-Up Location</h6>
                  <p>{pickUp}</p>
                </div>
              </span>
            </div>

            <div className="booking-modal__car-info__dates">
              <span>
                <i className="fa-solid fa-calendar-days"></i>
                <div>
                  <h6>Drop-Off Location</h6>
                  <p>{dropOff}</p>
                </div>
              </span>
            </div>
          </div>
          <div className="booking-modal__car-info__model">
            <h5>
              <span>Car -</span> {carType}
            </h5>
            {imgUrl && <img src={imgUrl} alt="car_img" />}
          </div>
        </div>
        {/* personal info */}
        <div className="booking-modal__person-info">
          {Number(carCount) > 1 && bookingPlan.length > 0 && (
            <div className="booking-plan">
              <h4>Multi-Car Plan</h4>
              {bookingPlan.map((item, index) => (
                <div key={`${item.carType}-${index}`} className="booking-plan__row">
                  <select
                    value={item.carType}
                    onChange={(e) => handlePlanItemChange(index, "carType", e.target.value)}
                  >
                    {CAR_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.carCount}
                    onChange={(e) => handlePlanItemChange(index, "carCount", e.target.value)}
                  />
                  <select
                    value={item.pickUp}
                    onChange={(e) => handlePlanItemChange(index, "pickUp", e.target.value)}
                  >
                    <option value="">Pick-up</option>
                    {LOCATIONS.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  <select
                    value={item.dropOff}
                    onChange={(e) => handlePlanItemChange(index, "dropOff", e.target.value)}
                  >
                    <option value="">Drop-off</option>
                    {LOCATIONS.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          <h4>Personal Information</h4>
          {modalErrorMessage && (
            <p className="booking-modal__alert">
              {modalErrorMessage}
              <i onClick={() => setModalErrorMessage("")} className="fa-solid fa-xmark"></i>
            </p>
          )}
          <form className="info-form">
            <div className="info-form__2col">
              <span>
                <label>
                  First Name <b>*</b>
                </label>
                <input
                  value={name}
                  onChange={handleName}
                  type="text"
                  placeholder="Enter your first name"
                ></input>
              </span>

              <span>
                <label>
                  Last Name <b>*</b>
                </label>
                <input
                  value={lastName}
                  onChange={handleLastName}
                  type="text"
                  placeholder="Enter your last name"
                ></input>
              </span>

              <span>
                <label>
                  Phone Number <b>*</b>
                </label>
                <input
                  value={phone}
                  onChange={handlePhone}
                  type="tel"
                  placeholder="Enter your phone number"
                ></input>
              </span>

              <span>
                <label>
                  Age <b>*</b>
                </label>
                <input
                  value={age}
                  onChange={handleAge}
                  type="number"
                  placeholder="18"
                ></input>
              </span>
            </div>

            <div className="info-form__1col">
              <span>
                <label>
                  Email <b>*</b>
                </label>
                <input
                  value={email}
                  onChange={handleEmail}
                  type="email"
                  placeholder="Enter your email address"
                ></input>
              </span>

              <span>
                <label>
                  Address <b>*</b>
                </label>
                <input
                  value={address}
                  onChange={handleAddress}
                  type="text"
                  placeholder="Enter your street address"
                ></input>
              </span>
            </div>

            <div className="info-form__2col">
              <span>
                <label>
                  City <b>*</b>
                </label>
                <input
                  value={city}
                  onChange={handleCity}
                  type="text"
                  placeholder="Enter your city"
                ></input>
              </span>

              <span>
                <label>
                  Zip Code <b>*</b>
                </label>
                <input
                  value={zipcode}
                  onChange={handleZip}
                  type="text"
                  placeholder="Enter your zip code"
                ></input>
              </span>
            </div>

            <span className="info-form__checkbox">
              <input type="checkbox"></input>
              <p>Please send me latest news and updates</p>
            </span>

            <div className="reserve-button">
              <button onClick={confirmBooking}>Reserve Now</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default BookCar;

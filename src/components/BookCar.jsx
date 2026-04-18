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
const contractAddress = "0x8d1aD974F97AE8671E8F345f254a5CFD22CE21BF";
const sepoliaChainId = 11155111;

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
  };

  const handleLastName = (e) => {
    setLastName(e.target.value);
  };

  const handlePhone = (e) => {
    setPhone(e.target.value);
  };

  const handleAge = (e) => {
    setAge(e.target.value);
  };

  const handleEmail = (e) => {
    setEmail(e.target.value);
  };

  const handleAddress = (e) => {
    setAddress(e.target.value);
  };

  const handleCity = (e) => {
    setCity(e.target.value);
  };

  const handleZip = (e) => {
    setZipCode(e.target.value);
  };

  // open modal when all inputs are fulfilled
  const openModal = async (e) => {
    e.preventDefault();
    const errorMsg = document.querySelector(".error-message");
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
      errorMsg.style.display = "flex";
      errorMsg.textContent = "Missing field";
    } else if (Number.isNaN(parsedCarCount) || parsedCarCount <= 0) {
      errorMsg.style.display = "flex";
      errorMsg.textContent = "Car count must be at least 1";
    } else if (pickDate >= dropDate || pickDate < today) {
      errorMsg.style.display = "flex";
      errorMsg.textContent = "Invalid date range";
    } else {
      setModal(!modal);
      const modalDiv = document.querySelector(".booking-modal");
      modalDiv.scroll(0, 0);
      errorMsg.style.display = "none";
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
    const errorMsg = document.querySelector(".error-message");
  
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
      errorMsg.style.display = "flex";
      errorMsg.textContent = "Missing field";
    } else {
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

        const pickUpDateInSeconds = Math.floor(new Date(pickTime).getTime() / 1000);
        const dropOffDateInSeconds = Math.floor(new Date(dropTime).getTime() / 1000);
        const parsedCarCount = Number(carCount);

        const [, , totalWei] = await carRentalContract.getBookingCost(
          carType,
          pickUpDateInSeconds,
          dropOffDateInSeconds,
          parsedCarCount
        );

        const transaction = await carRentalContract.bookCar(
          carType,
          pickUpDateInSeconds,
          dropOffDateInSeconds,
          parsedCarCount,
          { value: totalWei }
        );

        await transaction.wait();

        errorMsg.style.display = "none";
        setModal(!modal);
        const doneMsg = document.querySelector(".booking-done");
        doneMsg.style.display = "flex";
      } catch (error) {
        // Handle errors (e.g., user rejected the transaction)
        console.error("Payment error:", error);
        errorMsg.style.display = "flex";
        errorMsg.textContent = error?.message || "Payment failed";
      }
    }
  };
  

  // taking value of booking inputs
  const handleCar = (e) => {
    setCarType(e.target.value);
    setCarImg(e.target.value);
  };

  const handlePick = (e) => {
    setPickUp(e.target.value);
  };

  const handleDrop = (e) => {
    setDropOff(e.target.value);
  };

  const handlePickTime = (e) => {
    setPickTime(e.target.value);
  };

  const handleDropTime = (e) => {
    setDropTime(e.target.value);
  };

  const handleCarCount = (e) => {
    setCarCount(e.target.value);
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
    const doneMsg = document.querySelector(".booking-done");
    doneMsg.style.display = "none";
  };

  return (
    <>
      <section id="booking-section" className="book-section">
        {/* overlay */}
        <div
          onClick={openModal}
          className={`modal-overlay ${modal ? "active-modal" : ""}`}
        ></div>

        <div className="container">
          <div className="book-content">
            <div className="book-content__box">
              <h2>Book a car</h2>

              <p className="error-message">
                All fields required! <i className="fa-solid fa-xmark"></i>
              </p>

              <p className="booking-done">
                Check your email for confirmation.{" "}
                <i onClick={hideMessage} className="fa-solid fa-xmark"></i>
              </p>

              <form className="box-form">
                <div className="box-form__car-type">
                  <label>
                    <i className="fa-solid fa-car"></i> &nbsp; Select Your Car
                    Type <b>*</b>
                  </label>
                  <select value={carType} onChange={handleCar}>
                    <option>Select your car type</option>
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
                    <option>Select pick up location</option>
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
                    <option>Select drop off location</option>
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
                    max="10"
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
          <i onClick={openModal} className="fa-solid fa-xmark"></i>
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
          <h4>Personal Information</h4>
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
                <p className="error-modal">This field is required.</p>
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
                <p className="error-modal ">This field is required.</p>
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
                <p className="error-modal">This field is required.</p>
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
                <p className="error-modal ">This field is required.</p>
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
                <p className="error-modal">This field is required.</p>
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
                <p className="error-modal ">This field is required.</p>
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
                <p className="error-modal">This field is required.</p>
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
                <p className="error-modal ">This field is required.</p>
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

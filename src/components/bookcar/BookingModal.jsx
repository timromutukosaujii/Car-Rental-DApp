const PROFILE_FIELDS_TWO_COL_TOP = [
  { key: "name", label: "First Name", type: "text", placeholder: "Enter your first name" },
  { key: "lastName", label: "Last Name", type: "text", placeholder: "Enter your last name" },
  { key: "phone", label: "Phone Number", type: "tel", placeholder: "Enter your phone number" },
  { key: "age", label: "Age", type: "number", placeholder: "18" },
];

const PROFILE_FIELDS_ONE_COL = [
  { key: "email", label: "Email", type: "email", placeholder: "Enter your email address" },
  { key: "address", label: "Address", type: "text", placeholder: "Enter your street address" },
];

const PROFILE_FIELDS_TWO_COL_BOTTOM = [
  { key: "city", label: "City", type: "text", placeholder: "Enter your city" },
  { key: "postcode", label: "Post Code", type: "text", placeholder: "Enter your post code" },
];

function BookingModal({
  isOpen,
  formData,
  carImgUrl,
  bookingPlan,
  carTypes,
  locations,
  modalErrorMessage,
  profile,
  onClose,
  onClearModalError,
  onPlanItemChange,
  onProfileFieldChange,
  onConfirm,
}) {
  const parsedCarCount = Number(formData.carCount || 0);

  return (
    <div className={`booking-modal ${isOpen ? "active-modal" : ""}`}>
      <div className="booking-modal__title">
        <h2>Complete Reservation</h2>
        <i onClick={onClose} className="fa-solid fa-xmark"></i>
      </div>

      <div className="booking-modal__car-info">
        <div className="dates-div">
          <div className="booking-modal__car-info__dates">
            <h5>Location & Date</h5>
            <span>
              <i className="fa-solid fa-location-dot"></i>
              <div>
                <h6>Pick-Up Date & Time</h6>
                <p>
                  {formData.pickTime} / <input type="time" className="input-time"></input>
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
                  {formData.dropTime} / <input type="time" className="input-time"></input>
                </p>
              </div>
            </span>
          </div>

          <div className="booking-modal__car-info__dates">
            <span>
              <i className="fa-solid fa-calendar-days"></i>
              <div>
                <h6>Pick-Up Location</h6>
                <p>{formData.pickUp}</p>
              </div>
            </span>
          </div>

          <div className="booking-modal__car-info__dates">
            <span>
              <i className="fa-solid fa-calendar-days"></i>
              <div>
                <h6>Drop-Off Location</h6>
                <p>{formData.dropOff}</p>
              </div>
            </span>
          </div>
        </div>

        <div className="booking-modal__car-info__model">
          <h5>
            <span>Car -</span> {formData.carType}
          </h5>
          {carImgUrl && <img src={carImgUrl} alt="car_img" />}
        </div>
      </div>

      <div className="booking-modal__person-info">
        {parsedCarCount > 1 && bookingPlan.length > 0 && (
          <div className="booking-plan">
            <h4>Multi-Car Plan</h4>
            {bookingPlan.map((item, index) => (
              <div key={`${item.carType}-${index}`} className="booking-plan__row">
                <select
                  value={item.carType}
                  onChange={(event) => onPlanItemChange(index, "carType", event.target.value)}
                >
                  {carTypes.map((type) => (
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
                  onChange={(event) => onPlanItemChange(index, "carCount", event.target.value)}
                />
                <select
                  value={item.pickUp}
                  onChange={(event) => onPlanItemChange(index, "pickUp", event.target.value)}
                >
                  <option value="">Pick-up</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <select
                  value={item.dropOff}
                  onChange={(event) => onPlanItemChange(index, "dropOff", event.target.value)}
                >
                  <option value="">Drop-off</option>
                  {locations.map((location) => (
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
            <i onClick={onClearModalError} className="fa-solid fa-xmark"></i>
          </p>
        )}

        <form className="info-form">
          <div className="info-form__2col">
            {PROFILE_FIELDS_TWO_COL_TOP.map((field) => (
              <span key={field.key}>
                <label>
                  {field.label} <b>*</b>
                </label>
                <input
                  value={profile[field.key]}
                  onChange={(event) => onProfileFieldChange(field.key, event.target.value)}
                  type={field.type}
                  placeholder={field.placeholder}
                ></input>
              </span>
            ))}
          </div>

          <div className="info-form__1col">
            {PROFILE_FIELDS_ONE_COL.map((field) => (
              <span key={field.key}>
                <label>
                  {field.label} <b>*</b>
                </label>
                <input
                  value={profile[field.key]}
                  onChange={(event) => onProfileFieldChange(field.key, event.target.value)}
                  type={field.type}
                  placeholder={field.placeholder}
                ></input>
              </span>
            ))}
          </div>

          <div className="info-form__2col">
            {PROFILE_FIELDS_TWO_COL_BOTTOM.map((field) => (
              <span key={field.key}>
                <label>
                  {field.label} <b>*</b>
                </label>
                <input
                  value={profile[field.key]}
                  onChange={(event) => onProfileFieldChange(field.key, event.target.value)}
                  type={field.type}
                  placeholder={field.placeholder}
                ></input>
              </span>
            ))}
          </div>

          <span className="info-form__checkbox">
            <input type="checkbox"></input>
            <p>Please send me latest news and updates</p>
          </span>

          <div className="reserve-button">
            <button onClick={onConfirm}>Reserve Now</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingModal;

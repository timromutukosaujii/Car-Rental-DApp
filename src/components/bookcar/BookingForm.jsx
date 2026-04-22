function BookingForm({
  formData,
  carTypes,
  locations,
  formErrorMessage,
  formInfoMessage,
  bookingSuccessMessage,
  clearFormError,
  clearFormInfo,
  clearBookingSuccess,
  onFieldChange,
  onSearch,
}) {
  return (
    <div className="book-content__box">
      <h2>Book a car</h2>

      {formErrorMessage && (
        <p className="error-message">
          {formErrorMessage}
          <i onClick={clearFormError} className="fa-solid fa-xmark"></i>
        </p>
      )}

      {bookingSuccessMessage && (
        <p className="booking-done">
          {bookingSuccessMessage}
          <i onClick={clearBookingSuccess} className="fa-solid fa-xmark"></i>
        </p>
      )}

      {formInfoMessage && (
        <p className="booking-info">
          {formInfoMessage}
          <i onClick={clearFormInfo} className="fa-solid fa-xmark"></i>
        </p>
      )}

      <form className="box-form">
        <div className="box-form__car-type">
          <label>
            <i className="fa-solid fa-car"></i> &nbsp; Select Your Car Type <b>*</b>
          </label>
          <select
            value={formData.carType}
            onChange={(event) => onFieldChange("carType", event.target.value)}
          >
            <option value="">Select your car type</option>
            {carTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="box-form__car-type">
          <label>
            <i className="fa-solid fa-location-dot"></i> &nbsp; Pick-up <b>*</b>
          </label>
          <select
            value={formData.pickUp}
            onChange={(event) => onFieldChange("pickUp", event.target.value)}
          >
            <option value="">Select pick up location</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        <div className="box-form__car-type">
          <label>
            <i className="fa-solid fa-location-dot"></i> &nbsp; Drop-of <b>*</b>
          </label>
          <select
            value={formData.dropOff}
            onChange={(event) => onFieldChange("dropOff", event.target.value)}
          >
            <option value="">Select drop off location</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        <div className="box-form__car-time">
          <label htmlFor="picktime">
            <i className="fa-regular fa-calendar-days "></i> &nbsp; Pick-up <b>*</b>
          </label>
          <input
            id="picktime"
            value={formData.pickTime}
            onChange={(event) => onFieldChange("pickTime", event.target.value)}
            type="date"
          />
        </div>

        <div className="box-form__car-time">
          <label htmlFor="droptime">
            <i className="fa-regular fa-calendar-days "></i> &nbsp; Drop-of <b>*</b>
          </label>
          <input
            id="droptime"
            value={formData.dropTime}
            onChange={(event) => onFieldChange("dropTime", event.target.value)}
            type="date"
          />
        </div>

        <div className="box-form__car-time">
          <label htmlFor="carcount">
            <i className="fa-solid fa-hashtag"></i> &nbsp; Number of Cars <b>*</b>
          </label>
          <input
            id="carcount"
            value={formData.carCount}
            onChange={(event) => onFieldChange("carCount", event.target.value)}
            type="number"
            min="1"
            step="1"
          />
        </div>

        <button onClick={onSearch} type="submit">
          Search
        </button>
      </form>
    </div>
  );
}

export default BookingForm;

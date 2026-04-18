import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CarBox from "./CarBox";
import { CAR_DATA } from "./CarData";

const fleetSlides = [
  { label: "VW Arteon", active: "SecondCar", btn: "btn1", carID: 1, key: "second" },
  { label: "Audi A5 S-Line", active: "FirstCar", btn: "btn2", carID: 0, key: "first" },
  { label: "Toyota Corolla Hybrid", active: "ThirdCar", btn: "btn3", carID: 2, key: "third" },
  { label: "BMW 530", active: "FourthCar", btn: "btn4", carID: 3, key: "fourth" },
  { label: "Kia Sportage", active: "FifthCar", btn: "btn5", carID: 4, key: "fifth" },
  { label: "Mini Cooper", active: "SixthCar", btn: "btn6", carID: 5, key: "sixth" },
  { label: "Mercedes C-Class", active: "SeventhCar", btn: "btn7", carID: 6, key: "seventh" },
  { label: "Range Rover", active: "EighthCar", btn: "btn8", carID: 7, key: "eighth" },
  { label: "BYD Atto 2", active: "NinthCar", btn: "btn9", carID: 8, key: "ninth" },
];

function PickCar() {
  const [active, setActive] = useState("SecondCar");
  const [colorBtn, setColorBtn] = useState("btn1");

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentIndex = fleetSlides.findIndex((slide) => slide.active === active);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % fleetSlides.length;
      setActive(fleetSlides[nextIndex].active);
      setColorBtn(fleetSlides[nextIndex].btn);
    }, 4200);

    return () => clearInterval(intervalId);
  }, [active]);

  const coloringButton = (id) => {
    return colorBtn === id ? "colored-button" : "";
  };

  const currentSlide = fleetSlides.find((slide) => slide.active === active) || fleetSlides[0];

  return (
    <>
      <section className="pick-section">
        <div className="container">
          <motion.div
            className="pick-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="pick-container__title">
              <h3>Vehicle Models</h3>
              <h2>Our rental fleet</h2>
              <p>
                Choose from a variety of our amazing vehicles to rent for your
                next adventure or business trip
              </p>
            </div>
            <div className="pick-container__car-content">
              {/* pick car */}
              <div className="pick-box">
                {fleetSlides.map((slide) => (
                  <button
                    key={slide.btn}
                    className={`${coloringButton(slide.btn)}`}
                    id={slide.btn}
                    onClick={() => {
                      setActive(slide.active);
                      setColorBtn(slide.btn);
                    }}
                  >
                    {slide.label}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.key}
                  initial={{ opacity: 0, x: 30, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 1.02 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <CarBox data={CAR_DATA} carID={currentSlide.carID} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default PickCar;

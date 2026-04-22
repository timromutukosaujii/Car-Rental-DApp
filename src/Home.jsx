import BookCar from "./components/BookCar";
import BookingHistory from "./components/BookingHistory";
import PlanTrip from "./components/PlanTrip";
import PickCar from "./components/PickCar";
import ChooseUs from "./components/ChooseUs";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";

function Home() {
  return (
    <>
      <BookCar />
      <BookingHistory />
      <PlanTrip />
      <PickCar />
      <ChooseUs />
      <Testimonials />
      <Footer />
    </>
  );
}

export default Home;

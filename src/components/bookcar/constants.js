import CarAudi from "../../images/cars-big/audi-box.png";
import CarVW from "../../images/cars-big/arteon-box.jpg";
import CarToyota from "../../images/cars-big/corolla-box.png";
import CarBmw from "../../images/cars-big/bmw-box.png";
import CarKia from "../../images/cars-big/sportage-box.png";
import CarMini from "../../images/cars-big/mini-box.png";
import CarMercedes from "../../images/cars-big/mercedes-cclass.png";
import CarRangeRover from "../../images/cars-big/range-rover.png";
import CarByd from "../../images/cars-big/byd-atto2.png";

export const CONTRACT_ADDRESS =
  process.env.REACT_APP_CAR_RENTAL_CONTRACT_ADDRESS ||
  "0x8d1aD974F97AE8671E8F345f254a5CFD22CE21BF";

export const BACKEND_BASE_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

export const SEPOLIA_CHAIN_ID = 11155111;

export const CAR_TYPES = [
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

export const LOCATIONS = [
  "London",
  "Manchester",
  "Birmingham",
  "Liverpool",
  "Leeds",
  "Bristol",
];

export const CAR_IMAGE_BY_TYPE = {
  "Audi A5 S-Line": CarAudi,
  "VW Arteon": CarVW,
  "Toyota Corolla": CarToyota,
  "BMW 530": CarBmw,
  "Kia Sportage": CarKia,
  "Mini Cooper": CarMini,
  "Mercedes C-Class": CarMercedes,
  "Range Rover": CarRangeRover,
  "BYD Atto 2": CarByd,
};

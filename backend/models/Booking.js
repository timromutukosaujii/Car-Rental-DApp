const mongoose = require('mongoose');

const bookingPlanItemSchema = new mongoose.Schema(
  {
    carType: { type: String, trim: true, default: '' },
    carCount: { type: String, default: '0' },
    pickUp: { type: String, trim: true, default: '' },
    dropOff: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const profileSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    age: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    postcode: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const bookingSchemaPart = new mongoose.Schema(
  {
    carType: { type: String, trim: true, default: '' },
    pickUp: { type: String, trim: true, default: '' },
    dropOff: { type: String, trim: true, default: '' },
    pickUpDate: { type: String, trim: true, default: '' },
    dropOffDate: { type: String, trim: true, default: '' },
    carCount: { type: String, default: '0' },
    plan: { type: [bookingPlanItemSchema], default: [] },
  },
  { _id: false },
);

const blockchainSchema = new mongoose.Schema(
  {
    chainId: { type: Number, default: 0 },
    contractAddress: { type: String, trim: true, default: '' },
    txHashes: { type: [String], default: [] },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    walletAddress: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    profile: { type: profileSchema, default: () => ({}) },
    booking: { type: bookingSchemaPart, default: () => ({}) },
    blockchain: { type: blockchainSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: 'bookings',
  },
);

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

/* global ethers */

const { expect } = require('chai');

describe('CarRental', function () {
  async function deployFixture() {
    const [owner, renter, other] = await ethers.getSigners();
    const CarRental = await ethers.getContractFactory('CarRental');
    const carRental = await CarRental.deploy();
    await carRental.deployed();
    return { carRental, owner, renter, other };
  }

  async function bookOnce(carRental, renter, carType, days = 1, carCount = 1) {
    const now = (await ethers.provider.getBlock('latest')).timestamp;
    const pickUpDate = now + 24 * 60 * 60;
    const dropOffDate = pickUpDate + days * 24 * 60 * 60;
    const [, , totalWei] = await carRental.getBookingCost(
      carType,
      pickUpDate,
      dropOffDate,
      carCount,
    );

    await carRental.connect(renter).bookCar(carType, pickUpDate, dropOffDate, carCount, {
      value: totalWei,
    });

    return { pickUpDate, dropOffDate, totalWei };
  }

  it('deploys correctly with owner and default fleet', async function () {
    const { carRental, owner } = await deployFixture();
    expect(await carRental.owner()).to.equal(owner.address);

    const [totalUnits, rentedUnits] = await carRental.getCarAvailability('Toyota Corolla');
    expect(totalUnits.toNumber()).to.equal(4);
    expect(rentedUnits.toNumber()).to.equal(0);
  });

  it('allows only owner to set car config', async function () {
    const { carRental, owner, other } = await deployFixture();

    await expect(
      carRental.connect(other).setCarConfig('Toyota Corolla', ethers.utils.parseEther('0.03'), 5),
    ).to.be.revertedWith('Only owner');

    await expect(
      carRental.connect(owner).setCarConfig('Toyota Corolla', ethers.utils.parseEther('0.03'), 5),
    ).to.emit(carRental, 'CarConfigured');

    const [totalUnits] = await carRental.getCarAvailability('Toyota Corolla');
    expect(totalUnits.toNumber()).to.equal(5);
  });

  it('getBookingCost returns expected rental/deposit totals', async function () {
    const { carRental } = await deployFixture();
    const pickUpDate = 1710000000;
    const dropOffDate = pickUpDate + 2 * 24 * 60 * 60;

    const [rentalCostWei, depositWei, totalWei] = await carRental.getBookingCost(
      'Toyota Corolla',
      pickUpDate,
      dropOffDate,
      2,
    );

    expect(rentalCostWei).to.equal(ethers.utils.parseEther('0.092'));
    expect(depositWei).to.equal(ethers.utils.parseEther('0.02'));
    expect(totalWei).to.equal(ethers.utils.parseEther('0.112'));
  });

  it('bookCar succeeds with correct ETH and updates reservation state', async function () {
    const { carRental, renter } = await deployFixture();
    const { pickUpDate, dropOffDate, totalWei } = await bookOnce(
      carRental,
      renter,
      'Toyota Corolla',
      2,
      1,
    );

    expect(await carRental.reservationCount()).to.equal(1);
    const reservation = await carRental.getReservation(0);
    expect(reservation.renter).to.equal(renter.address);
    expect(reservation.carType).to.equal('Toyota Corolla');
    expect(reservation.pickUpDate.toNumber()).to.equal(pickUpDate);
    expect(reservation.dropOffDate.toNumber()).to.equal(dropOffDate);
    expect(reservation.rentalCostWei.add(reservation.depositAmountWei)).to.equal(totalWei);

    const [, rentedUnits] = await carRental.getCarAvailability('Toyota Corolla');
    expect(rentedUnits.toNumber()).to.equal(1);
  });

  it('bookCar reverts for invalid date range and insufficient payment', async function () {
    const { carRental, renter } = await deployFixture();
    const now = (await ethers.provider.getBlock('latest')).timestamp;
    const pickUpDate = now + 24 * 60 * 60;
    const dropOffDate = pickUpDate + 24 * 60 * 60;

    await expect(
      carRental.connect(renter).bookCar('Toyota Corolla', pickUpDate, pickUpDate, 1, {
        value: ethers.utils.parseEther('1'),
      }),
    ).to.be.revertedWith('Invalid date range');

    await expect(
      carRental.connect(renter).bookCar('Toyota Corolla', pickUpDate, dropOffDate, 1, {
        value: ethers.utils.parseEther('0.001'),
      }),
    ).to.be.revertedWith('Insufficient payment');
  });

  it('cancelReservation refunds and marks reservation returned', async function () {
    const { carRental, renter } = await deployFixture();
    const { totalWei } = await bookOnce(carRental, renter, 'Mini Cooper', 2, 1);

    await expect(carRental.connect(renter).cancelReservation(0))
      .to.emit(carRental, 'ReservationCanceled')
      .withArgs(0, totalWei);

    const reservation = await carRental.getReservation(0);
    expect(reservation.returned).to.equal(true);
  });

  it('returnReservation unlocks rented units after booking', async function () {
    const { carRental, renter } = await deployFixture();
    await bookOnce(carRental, renter, 'Audi A5 S-Line', 1, 1);

    await expect(carRental.connect(renter).returnReservation(0))
      .to.emit(carRental, 'ReservationReturned')
      .withArgs(0, ethers.utils.parseEther('0.01'));

    const [, rentedUnits] = await carRental.getCarAvailability('Audi A5 S-Line');
    expect(rentedUnits.toNumber()).to.equal(0);
  });

  it('reverts when booking more cars than available', async function () {
    const { carRental, renter, other } = await deployFixture();
    await bookOnce(carRental, renter, 'Range Rover', 1, 2);

    const now = (await ethers.provider.getBlock('latest')).timestamp;
    const pickUpDate = now + 24 * 60 * 60;
    const dropOffDate = pickUpDate + 24 * 60 * 60;
    const [, , totalWei] = await carRental.getBookingCost(
      'Range Rover',
      pickUpDate,
      dropOffDate,
      1,
    );

    await expect(
      carRental.connect(other).bookCar('Range Rover', pickUpDate, dropOffDate, 1, {
        value: totalWei,
      }),
    ).to.be.revertedWith('Car already rented');
  });
});

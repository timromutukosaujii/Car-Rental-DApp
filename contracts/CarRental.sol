// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CarRental {
    struct CarConfig {
        bool exists;
        uint256 dailyRateWei;
        uint256 totalUnits;
        uint256 rentedUnits;
    }

    struct Reservation {
        address renter;
        string carType;
        uint256 pickUpDate;
        uint256 dropOffDate;
        uint256 carCount;
        uint256 rentalCostWei;
        uint256 depositAmountWei;
        bool confirmed;
        bool returned;
    }

    uint256 public constant DEPOSIT_PER_CAR_WEI = 0.01 ether;

    address public owner;
    uint256 public reservationCount;
    mapping(bytes32 => CarConfig) public carConfigs;
    Reservation[] public reservations;

    bool private locked;

    event CarConfigured(string carType, uint256 dailyRateWei, uint256 totalUnits);
    event CarBooked(
        uint256 indexed reservationId,
        address indexed renter,
        string carType,
        uint256 pickUpDate,
        uint256 dropOffDate,
        uint256 carCount,
        uint256 rentalCostWei,
        uint256 depositAmountWei
    );
    event ReservationConfirmed(uint256 indexed reservationId);
    event ReservationReturned(uint256 indexed reservationId, uint256 refundedDepositWei);
    event ReservationCanceled(uint256 indexed reservationId, uint256 refundedWei);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrancy blocked");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        owner = msg.sender;
        _setCarConfig("Audi A5 S-Line", 0.037 ether, 3);
        _setCarConfig("VW Arteon", 0.031 ether, 3);
        _setCarConfig("Toyota Corolla", 0.023 ether, 4);
        _setCarConfig("BMW 530", 0.034 ether, 2);
        _setCarConfig("Kia Sportage", 0.025 ether, 4);
        _setCarConfig("Mini Cooper", 0.02 ether, 4);
        _setCarConfig("Mercedes C-Class", 0.041 ether, 2);
        _setCarConfig("Range Rover", 0.052 ether, 2);
        _setCarConfig("BYD Atto 2", 0.029 ether, 3);
    }

    function setCarConfig(
        string calldata _carType,
        uint256 _dailyRateWei,
        uint256 _totalUnits
    ) external onlyOwner {
        _setCarConfig(_carType, _dailyRateWei, _totalUnits);
    }

    function _setCarConfig(
        string memory _carType,
        uint256 _dailyRateWei,
        uint256 _totalUnits
    ) internal {
        require(bytes(_carType).length > 0, "Car type required");
        require(_dailyRateWei > 0, "Rate must be > 0");
        require(_totalUnits > 0, "Units must be > 0");

        bytes32 carKey = keccak256(bytes(_carType));
        CarConfig storage cfg = carConfigs[carKey];

        if (!cfg.exists) {
            cfg.exists = true;
        }

        require(cfg.rentedUnits <= _totalUnits, "Units below active bookings");
        cfg.dailyRateWei = _dailyRateWei;
        cfg.totalUnits = _totalUnits;

        emit CarConfigured(_carType, _dailyRateWei, _totalUnits);
    }

    function getBookingCost(
        string memory _carType,
        uint256 _pickUpDate,
        uint256 _dropOffDate,
        uint256 _carCount
    ) public view returns (uint256 rentalCostWei, uint256 depositWei, uint256 totalWei) {
        require(_carCount > 0, "Car count must be > 0");
        require(_dropOffDate > _pickUpDate, "Invalid date range");

        bytes32 carKey = keccak256(bytes(_carType));
        CarConfig storage cfg = carConfigs[carKey];
        require(cfg.exists, "Unknown car type");

        uint256 durationDays = _calculateDurationDays(_pickUpDate, _dropOffDate);
        uint256 rentalCost = cfg.dailyRateWei * durationDays * _carCount;
        uint256 depositCost = DEPOSIT_PER_CAR_WEI * _carCount;
        return (rentalCost, depositCost, rentalCost + depositCost);
    }

    function bookCar(
        string memory _carType,
        uint256 _pickUpDate,
        uint256 _dropOffDate,
        uint256 _carCount
    ) external payable {
        require(_pickUpDate >= block.timestamp, "Pick-up must be in future");
        require(_dropOffDate > _pickUpDate, "Invalid date range");
        require(_carCount > 0, "Car count must be > 0");

        bytes32 carKey = keccak256(bytes(_carType));
        CarConfig storage cfg = carConfigs[carKey];
        require(cfg.exists, "Unknown car type");
        require(cfg.rentedUnits + _carCount <= cfg.totalUnits, "Car already rented");

        (uint256 rentalCostWei, uint256 depositWei, uint256 totalWei) = getBookingCost(
            _carType,
            _pickUpDate,
            _dropOffDate,
            _carCount
        );
        require(msg.value >= totalWei, "Insufficient payment");

        reservations.push(
            Reservation({
                renter: msg.sender,
                carType: _carType,
                pickUpDate: _pickUpDate,
                dropOffDate: _dropOffDate,
                carCount: _carCount,
                rentalCostWei: rentalCostWei,
                depositAmountWei: depositWei,
                confirmed: false,
                returned: false
            })
        );

        cfg.rentedUnits += _carCount;
        uint256 reservationId = reservationCount;
        reservationCount += 1;

        emit CarBooked(
            reservationId,
            msg.sender,
            _carType,
            _pickUpDate,
            _dropOffDate,
            _carCount,
            rentalCostWei,
            depositWei
        );
    }

    function confirmReservation(uint256 _reservationId) external {
        require(_reservationId < reservationCount, "Invalid reservation ID");
        Reservation storage reservation = reservations[_reservationId];
        require(msg.sender == reservation.renter, "Only renter can confirm");
        require(!reservation.returned, "Already returned");
        reservation.confirmed = true;
        emit ReservationConfirmed(_reservationId);
    }

    function returnReservation(uint256 _reservationId) external nonReentrant {
        require(_reservationId < reservationCount, "Invalid reservation ID");
        Reservation storage reservation = reservations[_reservationId];
        require(msg.sender == reservation.renter, "Only renter can return");
        require(!reservation.returned, "Already returned");

        reservation.returned = true;

        bytes32 carKey = keccak256(bytes(reservation.carType));
        CarConfig storage cfg = carConfigs[carKey];
        require(cfg.rentedUnits >= reservation.carCount, "Invalid rented units");
        cfg.rentedUnits -= reservation.carCount;

        (bool sent, ) = payable(msg.sender).call{value: reservation.depositAmountWei}("");
        require(sent, "Deposit refund failed");

        emit ReservationReturned(_reservationId, reservation.depositAmountWei);
    }

    function cancelReservation(uint256 _reservationId) external nonReentrant {
        require(_reservationId < reservationCount, "Invalid reservation ID");
        Reservation storage reservation = reservations[_reservationId];
        require(msg.sender == reservation.renter, "Only renter can cancel");
        require(!reservation.returned, "Already returned");
        require(block.timestamp < reservation.pickUpDate, "Already started");

        reservation.returned = true;

        bytes32 carKey = keccak256(bytes(reservation.carType));
        CarConfig storage cfg = carConfigs[carKey];
        require(cfg.rentedUnits >= reservation.carCount, "Invalid rented units");
        cfg.rentedUnits -= reservation.carCount;

        uint256 refundWei = reservation.rentalCostWei + reservation.depositAmountWei;
        (bool sent, ) = payable(msg.sender).call{value: refundWei}("");
        require(sent, "Refund failed");

        emit ReservationCanceled(_reservationId, refundWei);
    }

    function getCarAvailability(string memory _carType) external view returns (uint256 totalUnits, uint256 rentedUnits) {
        bytes32 carKey = keccak256(bytes(_carType));
        CarConfig storage cfg = carConfigs[carKey];
        require(cfg.exists, "Unknown car type");
        return (cfg.totalUnits, cfg.rentedUnits);
    }

    function getReservation(uint256 _reservationId)
        external
        view
        returns (
            address renter,
            string memory carType,
            uint256 pickUpDate,
            uint256 dropOffDate,
            uint256 carCount,
            uint256 rentalCostWei,
            uint256 depositAmountWei,
            bool confirmed,
            bool returned
        )
    {
        require(_reservationId < reservationCount, "Invalid reservation ID");
        Reservation storage reservation = reservations[_reservationId];
        return (
            reservation.renter,
            reservation.carType,
            reservation.pickUpDate,
            reservation.dropOffDate,
            reservation.carCount,
            reservation.rentalCostWei,
            reservation.depositAmountWei,
            reservation.confirmed,
            reservation.returned
        );
    }

    function _calculateDurationDays(uint256 _pickUpDate, uint256 _dropOffDate) internal pure returns (uint256) {
        uint256 secondsDiff = _dropOffDate - _pickUpDate;
        uint256 daysDiff = secondsDiff / 1 days;
        if (secondsDiff % 1 days > 0) {
            daysDiff += 1;
        }
        if (daysDiff == 0) {
            daysDiff = 1;
        }
        return daysDiff;
    }
}

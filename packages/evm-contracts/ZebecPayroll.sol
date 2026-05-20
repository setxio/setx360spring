// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ZebecPayroll
 * @dev Manages continuous, by-the-second streaming payroll for SETX 360 delivery marketplace drivers.
 * Allows gig workers to withdraw accrued earnings instantly mid-shift.
 */
contract ZebecPayroll {

    address public admin;

    struct Stream {
        uint256 id;
        address recipient;
        uint256 ratePerSecond; // SETX stablecoin wei per second
        uint256 startTime;
        uint256 stopTime;
        uint256 withdrawnAmount;
        bool isActive;
    }

    uint256 public streamCount;
    mapping(uint256 => Stream) public streams;
    mapping(address => uint256[]) public activeStreamsByDriver;

    event StreamCreated(uint256 indexed id, address indexed recipient, uint256 ratePerSecond, uint256 stopTime);
    event Withdrawn(uint256 indexed streamId, address indexed recipient, uint256 amount);
    event StreamCancelled(uint256 indexed streamId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Initiates a continuous token stream.
     */
    function createStream(
        address _recipient, 
        uint256 _ratePerSecond, 
        uint256 _durationHours
    ) external onlyAdmin {
        streamCount++;
        uint256 startTime = block.timestamp;
        uint256 stopTime = startTime + (_durationHours * 1 hours);

        streams[streamCount] = Stream({
            id: streamCount,
            recipient: _recipient,
            ratePerSecond: _ratePerSecond,
            startTime: startTime,
            stopTime: stopTime,
            withdrawnAmount: 0,
            isActive: true
        });

        activeStreamsByDriver[_recipient].push(streamCount);

        emit StreamCreated(streamCount, _recipient, _ratePerSecond, stopTime);
    }

    /**
     * @dev Calculates the total amount earned by the driver up to the current second.
     */
    function balanceEarned(uint256 _streamId) public view returns (uint256) {
        Stream memory stream = streams[_streamId];
        if (!stream.isActive || block.timestamp <= stream.startTime) return 0;

        uint256 endTime = block.timestamp < stream.stopTime ? block.timestamp : stream.stopTime;
        uint256 totalAccrued = (endTime - stream.startTime) * stream.ratePerSecond;
        
        if (totalAccrued <= stream.withdrawnAmount) return 0;
        return totalAccrued - stream.withdrawnAmount;
    }

    /**
     * @dev Allows the driver to withdraw their accrued earnings instantly mid-shift.
     */
    function withdrawFromStream(uint256 _streamId, uint256 _amount) external {
        Stream storage stream = streams[_streamId];
        require(stream.isActive == true, "Stream is not active");
        require(msg.sender == stream.recipient, "Caller is not the stream recipient");

        uint256 available = balanceEarned(_streamId);
        require(available >= _amount, "Insufficient accrued balance");

        stream.withdrawnAmount += _amount;

        // In a full production implementation, this transfers ERC-20 SETX tokens to the driver.
        // e.g. setxToken.transfer(stream.recipient, _amount);

        emit Withdrawn(_streamId, msg.sender, _amount);
    }
}

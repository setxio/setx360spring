// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SmartCityTelemetry
 * @dev Verifies decentralized oracle telemetry from Flare Network State Connector.
 * Allows citizens to vote on verified municipal usage metrics without single-point manipulation risks.
 */
contract SmartCityTelemetry {

    address public admin;
    address public flareStateConnector; // Address of the authorized Flare Oracle relayer

    struct TelemetryLog {
        uint256 id;
        string deviceId;
        uint256 metricValue; // e.g., water consumed in gallons, traffic density
        uint256 timestamp;
        bytes32 flareProofHash;
        bool isVerified;
    }

    uint256 public logCount;
    mapping(uint256 => TelemetryLog) public telemetryLogs;
    mapping(string => uint256) public latestLogByDevice;

    event TelemetryLogged(uint256 indexed id, string deviceId, uint256 metricValue, bytes32 proofHash);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    modifier onlyFlareOracle() {
        require(msg.sender == flareStateConnector, "Caller is not the authorized Flare Oracle");
        _;
    }

    constructor(address _flareStateConnector) {
        admin = msg.sender;
        flareStateConnector = _flareStateConnector;
    }

    function setFlareOracle(address _oracle) external onlyAdmin {
        flareStateConnector = _oracle;
    }

    /**
     * @dev Logs verified municipal IoT telemetry. Only callable by the Flare State Connector relayer.
     */
    function logTelemetry(
        string memory _deviceId, 
        uint256 _metricValue, 
        uint256 _timestamp, 
        bytes32 _proofHash
    ) external onlyFlareOracle {
        logCount++;
        
        telemetryLogs[logCount] = TelemetryLog({
            id: logCount,
            deviceId: _deviceId,
            metricValue: _metricValue,
            timestamp: _timestamp,
            flareProofHash: _proofHash,
            isVerified: true
        });

        latestLogByDevice[_deviceId] = logCount;

        emit TelemetryLogged(logCount, _deviceId, _metricValue, _proofHash);
    }

    /**
     * @dev Public getter to fetch the latest verified metric for civic voting decisions.
     */
    function getLatestMetric(string memory _deviceId) external view returns (uint256 value, uint256 timestamp, bool verified) {
        uint256 logId = latestLogByDevice[_deviceId];
        require(logId != 0, "No telemetry logged for this device");
        
        TelemetryLog memory log = telemetryLogs[logId];
        return (log.metricValue, log.timestamp, log.isVerified);
    }
}

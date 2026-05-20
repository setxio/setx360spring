// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SETXCouncilManager
 * @notice Enforces Texas HB 4518 DUNA Administration via a 5-Seat Regional Digital Council.
 * Implements 3-Tier Separation of Powers, 2-Year Term Limits (2-Term Cap), and Founder Seat Burn.
 */
contract SETXCouncilManager {
    
    // ==========================================
    // STRUCTS & STORAGE
    // ==========================================

    struct CouncilSeat {
        uint256 id;
        string cityName;
        address currentRepresentative;
        uint256 termStartTime;
        uint256 termExpiryTime;
        bool isPermanentFounderSeat;
    }

    struct CouncilAction {
        uint256 id;
        string description;
        uint256 targetAmount;
        address recipient;
        uint256 approvalCount;
        uint256 citizenVetoCount;
        bool executed;
        bool vetoed;
        mapping(address => bool) approvals;
        mapping(address => bool) citizenVetoes;
    }

    // 5 Council Seats
    mapping(uint256 => CouncilSeat) public councilSeats;
    
    // Term Limits Tracking (2-Year Terms, 2-Term Cap, 2-Year Cool-Down)
    mapping(address => uint256) public termCounter;
    mapping(address => uint256) public coolDownExpiry;

    // Multi-Sig Action Proposals (Tier 2)
    uint256 public actionCount;
    mapping(uint256 => CouncilAction) public councilActions;

    // Strict 3-of-5 Consensus Threshold
    uint256 public constant CONSENSUS_THRESHOLD = 3;
    uint256 public constant TERM_DURATION = 730 days; // 2 Years
    uint256 public constant CITIZEN_VETO_THRESHOLD = 1000; // 1,000 Verified SBT Holders to override

    // Events
    event RepresentativeElected(uint256 indexed seatId, address indexed newRepresentative, uint256 termExpiry);
    event ActionProposed(uint256 indexed actionId, string description, uint256 targetAmount);
    event ActionSigned(uint256 indexed actionId, address indexed councilMember, uint256 totalApprovals);
    event ActionExecuted(uint256 indexed actionId, address indexed recipient, uint256 amount);
    event SovereignVetoTriggered(uint256 indexed actionId, uint256 totalVetoes);
    event FounderSeatBurned(address indexed oldFounder, address indexed newElectedRepresentative);

    // ==========================================
    // CONSTRUCTOR (INITIALIZING THE 5 SEATS)
    // ==========================================

    constructor(
        address _beaumontRep,
        address _portArthurRep,
        address _orangeRep,
        address _grovesRep,
        address _founderTechRep
    ) {
        // Seat 1: Beaumont Representative
        councilSeats[1] = CouncilSeat(1, "Beaumont", _beaumontRep, block.timestamp, block.timestamp + TERM_DURATION, false);
        termCounter[_beaumontRep] = 1;

        // Seat 2: Port Arthur Representative
        councilSeats[2] = CouncilSeat(2, "Port Arthur", _portArthurRep, block.timestamp, block.timestamp + TERM_DURATION, false);
        termCounter[_portArthurRep] = 1;

        // Seat 3: Orange Representative
        councilSeats[3] = CouncilSeat(3, "Orange", _orangeRep, block.timestamp, block.timestamp + TERM_DURATION, false);
        termCounter[_orangeRep] = 1;

        // Seat 4: Groves/Nederland Representative
        councilSeats[4] = CouncilSeat(4, "Groves/Nederland", _grovesRep, block.timestamp, block.timestamp + TERM_DURATION, false);
        termCounter[_grovesRep] = 1;

        // Seat 5: SETX.io LLC Technical Infrastructure Seat (Permanent during Phase 1)
        councilSeats[5] = CouncilSeat(5, "SETX.io Tech Infrastructure", _founderTechRep, block.timestamp, block.timestamp + (TERM_DURATION * 10), true);
    }

    // ==========================================
    // MODIFIERS
    // ==========================================

    modifier onlyCouncilMember() {
        bool isMember = false;
        for (uint256 i = 1; i <= 5; i++) {
            if (councilSeats[i].currentRepresentative == msg.sender && block.timestamp <= councilSeats[i].termExpiryTime) {
                isMember = true;
                break;
            }
        }
        require(isMember, "CouncilManager: Caller is not an active, unexpired Digital Council representative.");
        _;
    }

    modifier onlyFounderSeat() {
        require(councilSeats[5].currentRepresentative == msg.sender, "CouncilManager: Caller does not hold the permanent Founder Tech seat.");
        require(councilSeats[5].isPermanentFounderSeat, "CouncilManager: Founder seat has already been burned and decentralized.");
        _;
    }

    // ==========================================
    // TERM LIMITS & ELECTION MECHANICS
    // ==========================================

    /**
     * @notice Enforces the 2-Term Cap and 2-Year Cool-Down Period before entering a ballot.
     */
    function applyForBallot() external view returns (bool) {
        require(termCounter[msg.sender] < 2, "CouncilManager: Candidate has reached the strict 2-term consecutive limit.");
        require(block.timestamp > coolDownExpiry[msg.sender], "CouncilManager: Candidate is currently serving a mandatory 2-year cool-down period.");
        return true;
    }

    /**
     * @notice Registers an elected representative to a specific city seat.
     * Updates term counters and enforces future cool-down locks.
     */
    function electRepresentative(uint256 _seatId, address _newRep) external {
        // In production, callable only by the SBT Voting Registry Contract
        require(_seatId >= 1 && _seatId <= 4, "CouncilManager: Invalid municipal seat ID.");
        require(termCounter[_newRep] < 2, "CouncilManager: New representative exceeds term limits.");
        require(block.timestamp > coolDownExpiry[_newRep], "CouncilManager: New representative is in cool-down.");

        CouncilSeat storage seat = councilSeats[_seatId];
        
        // Register new term
        seat.currentRepresentative = _newRep;
        seat.termStartTime = block.timestamp;
        seat.termExpiryTime = block.timestamp + TERM_DURATION;

        termCounter[_newRep] += 1;

        // If reaching the 2nd term, lock them out for 4 years (2 years term + 2 years cooldown)
        if (termCounter[_newRep] == 2) {
            coolDownExpiry[_newRep] = block.timestamp + (TERM_DURATION * 2);
        }

        emit RepresentativeElected(_seatId, _newRep, seat.termExpiryTime);
    }

    // ==========================================
    // TIER 2: MULTI-SIG COUNCIL DECISIONS
    // ==========================================

    /**
     * @notice Proposes a mid-tier operational action (e.g., $15k Disaster Relief Grant).
     */
    function proposeAction(string calldata _description, uint256 _targetAmount, address _recipient) external onlyCouncilMember returns (uint256) {
        actionCount++;
        CouncilAction storage newAction = councilActions[actionCount];
        newAction.id = actionCount;
        newAction.description = _description;
        newAction.targetAmount = _targetAmount;
        newAction.recipient = _recipient;
        newAction.approvalCount = 1; // Proposer automatically approves
        newAction.approvals[msg.sender] = true;

        emit ActionProposed(actionCount, _description, _targetAmount);
        emit ActionSigned(actionCount, msg.sender, 1);
        return actionCount;
    }

    /**
     * @notice Signs an active multi-sig proposal.
     */
    function signAction(uint256 _actionId) external onlyCouncilMember {
        CouncilAction storage action = councilActions[_actionId];
        require(!action.executed, "CouncilManager: Action already executed.");
        require(!action.vetoed, "CouncilManager: Action has been vetoed by sovereign citizens.");
        require(!action.approvals[msg.sender], "CouncilManager: Council member already signed.");

        action.approvals[msg.sender] = true;
        action.approvalCount++;

        emit ActionSigned(_actionId, msg.sender, action.approvalCount);
    }

    /**
     * @notice Executes a fully signed multi-sig proposal once 3-of-5 threshold is met.
     */
    function executeAction(uint256 _actionId) external onlyCouncilMember {
        CouncilAction storage action = councilActions[_actionId];
        require(!action.executed, "CouncilManager: Action already executed.");
        require(!action.vetoed, "CouncilManager: Action has been vetoed by sovereign citizens.");
        require(action.approvalCount >= CONSENSUS_THRESHOLD, "CouncilManager: Strict 3-of-5 consensus threshold not met.");

        action.executed = true;
        emit ActionExecuted(_actionId, action.recipient, action.targetAmount);
    }

    // ==========================================
    // TIER 3: SOVEREIGN CITIZEN VETO
    // ==========================================

    /**
     * @notice Allows verified Soulbound ID holders to cast a veto against a rogue council decision.
     */
    function citizenVetoOverride(uint256 _actionId) external {
        // In production, requires verification of caller's SETXIdentity Soulbound Token
        CouncilAction storage action = councilActions[_actionId];
        require(!action.executed, "CouncilManager: Action already executed.");
        require(!action.citizenVetoes[msg.sender], "CouncilManager: Citizen has already cast their single veto ballot.");

        action.citizenVetoes[msg.sender] = true;
        action.citizenVetoCount++;

        emit SovereignVetoTriggered(_actionId, action.citizenVetoCount);

        // If veto threshold reached, cancel the council action permanently
        if (action.citizenVetoCount >= CITIZEN_VETO_THRESHOLD) {
            action.vetoed = true;
        }
    }

    // ==========================================
    // PHASE 2: FOUNDER SEAT BURN PROTOCOL
    // ==========================================

    /**
     * @notice Permanently decentralizes the Founder's Tech seat, handing 100% control to an elected representative.
     */
    function burnFounderSeat(address _newElectedRep) external onlyFounderSeat {
        require(_newElectedRep != address(0), "CouncilManager: Cannot burn to zero address.");
        
        CouncilSeat storage seat5 = councilSeats[5];
        address oldFounder = seat5.currentRepresentative;

        seat5.currentRepresentative = _newElectedRep;
        seat5.isPermanentFounderSeat = false;
        seat5.termStartTime = block.timestamp;
        seat5.termExpiryTime = block.timestamp + TERM_DURATION;

        termCounter[_newElectedRep] = 1;

        emit FounderSeatBurned(oldFounder, _newElectedRep);
        emit RepresentativeElected(5, _newElectedRep, seat5.termExpiryTime);
    }
}

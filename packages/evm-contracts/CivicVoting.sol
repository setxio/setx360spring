// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CivicVoting
 * @dev Enforces the "One Citizen, One Vote" governance model for SETX 360.
 * Completely separates economic stablecoin wealth (balance_setx) from civic voting power.
 * Votes require a verified, non-transferable Soulbound DID (SETXIdentity).
 */
interface ISETXIdentity {
    function hasIdentity(address citizen) external view returns (bool);
}

contract CivicVoting {

    address public admin;

    struct Proposal {
        uint256 id;
        string title;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        bool isActive;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    // Mapping to track if a specific DID (or wallet) has voted on a proposal
    // proposalId => (citizenDid => hasVoted)
    // proposalId => (citizenDid => hasVoted)
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // The Soulbound Identity Contract Reference
    ISETXIdentity public identityContract;

    event ProposalCreated(uint256 indexed id, string title, uint256 endTime);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool voteChoice);
    event CitizenVerified(address indexed citizen);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    modifier onlyVerifiedCitizen() {
        require(address(identityContract) != address(0), "Identity contract not set");
        require(identityContract.hasIdentity(msg.sender) == true, "Caller is not a verified resident. SETXIdentity SBT required.");
        _;
    }

    constructor(address _identityContractAddress) {
        admin = msg.sender;
        identityContract = ISETXIdentity(_identityContractAddress);
    }

    /**
     * @dev Admin function to update the Identity Contract address if upgraded.
     */
    function setIdentityContract(address _address) external onlyAdmin {
        identityContract = ISETXIdentity(_address);
    }

    /**
     * @dev Creates a new community governance proposal.
     */
    function createProposal(string memory _title, uint256 _durationMinutes) external onlyAdmin {
        proposalCount++;
        uint256 endTime = block.timestamp + (_durationMinutes * 1 minutes);
        
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: _title,
            endTime: endTime,
            yesVotes: 0,
            noVotes: 0,
            isActive: true
        });

        emit ProposalCreated(proposalCount, _title, endTime);
    }

    /**
     * @dev Casts a single vote. 
     * Strictly ignores financial balances. 1 Wallet = 1 Vote.
     */
    function castVote(uint256 _proposalId, bool _support) external onlyVerifiedCitizen {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.isActive == true, "Proposal is not active");
        require(block.timestamp < proposal.endTime, "Voting period has ended");
        require(hasVoted[_proposalId][msg.sender] == false, "Citizen has already cast their single vote");

        // Record the vote
        hasVoted[_proposalId][msg.sender] = true;

        // Weight is exactly 1, regardless of wealth
        if (_support) {
            proposal.yesVotes += 1;
        } else {
            proposal.noVotes += 1;
        }

        emit VoteCast(_proposalId, msg.sender, _support);
    }
}

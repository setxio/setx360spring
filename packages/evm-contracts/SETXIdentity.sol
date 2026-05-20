// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SETXIdentity
 * @dev A non-transferable Soulbound Token (SBT) representing civic identity.
 * $1 ID = 1 Vote. Cannot be bought, sold, or transferred.
 */
contract SETXIdentity {
    string public name = "SETX Civic Identity";
    string public symbol = "SETXID";

    address public admin;

    // Mapping from citizen address to their unique Identity Token ID
    mapping(address => uint256) private _ownerToId;
    
    // Mapping from Token ID to citizen address
    mapping(uint256 => address) private _idToOwner;

    uint256 public nextTokenId = 1;

    event IdentityIssued(address indexed citizen, uint256 indexed tokenId);
    event IdentityRevoked(address indexed citizen, uint256 indexed tokenId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Issues exactly ONE non-transferable identity token to a verified resident.
     */
    function issueIdentity(address citizen) external onlyAdmin {
        require(_ownerToId[citizen] == 0, "Citizen already has an identity token");

        uint256 tokenId = nextTokenId++;
        _ownerToId[citizen] = tokenId;
        _idToOwner[tokenId] = citizen;

        emit IdentityIssued(citizen, tokenId);
    }

    /**
     * @dev Revokes identity if resident leaves jurisdiction.
     */
    function revokeIdentity(address citizen) external onlyAdmin {
        uint256 tokenId = _ownerToId[citizen];
        require(tokenId != 0, "Citizen does not have an identity token");

        delete _ownerToId[citizen];
        delete _idToOwner[tokenId];

        emit IdentityRevoked(citizen, tokenId);
    }

    /**
     * @dev Checks if an address possesses a valid Soulbound Identity.
     */
    function hasIdentity(address citizen) external view returns (bool) {
        return _ownerToId[citizen] != 0;
    }

    /**
     * @dev Overrides standard ERC-721 transfer mechanics to enforce Soulbound (non-transferable) status.
     * Reverts on any attempt to transfer the token.
     */
    function transferFrom(address, address, uint256) external pure {
        revert("SETXIdentity is Soulbound and non-transferable.");
    }
}

// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint16, externalEuint16, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title TalkletReview
 * @notice Privacy-preserving academic session review system using FHEVM
 * @dev Implements encrypted ratings with homomorphic aggregation
 */
contract TalkletReview is ZamaEthereumConfig {
    // Session structure
    struct Session {
        // Encrypted aggregated scores (must be first for proper storage layout)
        euint16 aggregatedClarity;
        euint16 aggregatedInnovation;
        euint16 aggregatedInspiration;
        // Session metadata
        uint256 id;
        string title;
        address speaker;
        address organizer;
        uint256 timestamp;
        bool isActive;
        uint256 reviewCount;
        // Decrypted scores (only after organizer requests)
        uint16 decryptedClarity;
        uint16 decryptedInnovation;
        uint16 decryptedInspiration;
        bool isDecrypted;
    }

    // Review structure (encrypted ratings)
    struct Review {
        euint16 clarity;
        euint16 innovation;
        euint16 inspiration;
        uint8 tags; // Bitmap: Technical(1) | Application(2) | Theoretical(4) | Methodological(8) | Ethical(16)
        uint16 qaDuration; // in minutes
        uint256 timestamp;
    }

    // State variables
    uint256 private _sessionIdCounter;
    mapping(uint256 => Session) public sessions;
    mapping(uint256 => mapping(address => Review)) private reviews;
    mapping(uint256 => mapping(address => bool)) public hasReviewed;
    mapping(uint256 => mapping(address => bool)) public isAuthorized;
    mapping(uint256 => address[]) private authorizedAttendees;

    // Events
    event SessionCreated(uint256 indexed sessionId, string title, address indexed speaker, address indexed organizer);
    event ReviewSubmitted(uint256 indexed sessionId, address indexed reviewer);
    event SessionClosed(uint256 indexed sessionId);
    event DecryptionRequested(uint256 indexed sessionId);
    event AttendeesAuthorized(uint256 indexed sessionId, address[] attendees);

    // Modifiers
    modifier onlyOrganizer(uint256 sessionId) {
        require(sessions[sessionId].organizer == msg.sender, "Not organizer");
        _;
    }

    modifier onlyAuthorized(uint256 sessionId) {
        require(isAuthorized[sessionId][msg.sender], "Not authorized");
        _;
    }

    modifier sessionActive(uint256 sessionId) {
        require(sessions[sessionId].isActive, "Session not active");
        _;
    }

    /**
     * @notice Create a new academic session
     * @param title Session title
     * @param speaker Speaker address
     * @param initialAttendees Initial authorized attendees (can be empty)
     */
    function createSession(
        string memory title,
        address speaker,
        address[] memory initialAttendees
    ) external returns (uint256) {
        require(speaker != address(0), "Invalid speaker address");
        require(bytes(title).length > 0, "Empty title");

        uint256 sessionId = _sessionIdCounter++;
        
        Session storage session = sessions[sessionId];
        session.id = sessionId;
        session.title = title;
        session.speaker = speaker;
        session.organizer = msg.sender;
        session.timestamp = block.timestamp;
        session.isActive = true;
        session.reviewCount = 0;
        
        // Initialize encrypted aggregates to zero
        session.aggregatedClarity = FHE.asEuint16(0);
        session.aggregatedInnovation = FHE.asEuint16(0);
        session.aggregatedInspiration = FHE.asEuint16(0);
        session.isDecrypted = false;

        // Grant this contract access to the initialized encrypted values
        FHE.allowThis(session.aggregatedClarity);
        FHE.allowThis(session.aggregatedInnovation);
        FHE.allowThis(session.aggregatedInspiration);

        // Authorize initial attendees
        if (initialAttendees.length > 0) {
            _authorizeAttendees(sessionId, initialAttendees);
        }

        emit SessionCreated(sessionId, title, speaker, msg.sender);
        return sessionId;
    }

    /**
     * @notice Authorize attendees to review a session
     * @param sessionId Session ID
     * @param attendees Array of attendee addresses
     */
    function authorizeAttendees(uint256 sessionId, address[] memory attendees) 
        external 
        onlyOrganizer(sessionId) 
    {
        _authorizeAttendees(sessionId, attendees);
    }

    function _authorizeAttendees(uint256 sessionId, address[] memory attendees) private {
        for (uint256 i = 0; i < attendees.length; i++) {
            if (!isAuthorized[sessionId][attendees[i]]) {
                isAuthorized[sessionId][attendees[i]] = true;
                authorizedAttendees[sessionId].push(attendees[i]);
            }
        }
        emit AttendeesAuthorized(sessionId, attendees);
    }

    /**
     * @notice Submit encrypted review for a session
     * @param sessionId Session ID
     * @param encryptedClarity Encrypted clarity rating (1-10)
     * @param clarityProof Input proof for clarity
     * @param encryptedInnovation Encrypted innovation rating (1-10)
     * @param innovationProof Input proof for innovation
     * @param encryptedInspiration Encrypted inspiration rating (1-10)
     * @param inspirationProof Input proof for inspiration
     * @param tags Question tags bitmap
     * @param qaDuration Q&A duration in minutes
     */
    function submitReview(
        uint256 sessionId,
        externalEuint16 encryptedClarity,
        bytes calldata clarityProof,
        externalEuint16 encryptedInnovation,
        bytes calldata innovationProof,
        externalEuint16 encryptedInspiration,
        bytes calldata inspirationProof,
        uint8 tags,
        uint16 qaDuration
    ) external onlyAuthorized(sessionId) sessionActive(sessionId) {
        // Convert encrypted inputs to euint16
        euint16 clarity = FHE.fromExternal(encryptedClarity, clarityProof);
        euint16 innovation = FHE.fromExternal(encryptedInnovation, innovationProof);
        euint16 inspiration = FHE.fromExternal(encryptedInspiration, inspirationProof);

        // Store review
        Review storage review = reviews[sessionId][msg.sender];
        bool isUpdate = hasReviewed[sessionId][msg.sender];

        if (isUpdate) {
            // Update: subtract old values, add new values
            sessions[sessionId].aggregatedClarity = FHE.sub(
                sessions[sessionId].aggregatedClarity,
                review.clarity
            );
            sessions[sessionId].aggregatedInnovation = FHE.sub(
                sessions[sessionId].aggregatedInnovation,
                review.innovation
            );
            sessions[sessionId].aggregatedInspiration = FHE.sub(
                sessions[sessionId].aggregatedInspiration,
                review.inspiration
            );
        } else {
            // New review
            hasReviewed[sessionId][msg.sender] = true;
            sessions[sessionId].reviewCount++;
        }

        // Add new encrypted ratings to aggregates
        sessions[sessionId].aggregatedClarity = FHE.add(
            sessions[sessionId].aggregatedClarity,
            clarity
        );
        sessions[sessionId].aggregatedInnovation = FHE.add(
            sessions[sessionId].aggregatedInnovation,
            innovation
        );
        sessions[sessionId].aggregatedInspiration = FHE.add(
            sessions[sessionId].aggregatedInspiration,
            inspiration
        );

        // Grant this contract access to the aggregate results
        FHE.allowThis(sessions[sessionId].aggregatedClarity);
        FHE.allowThis(sessions[sessionId].aggregatedInnovation);
        FHE.allowThis(sessions[sessionId].aggregatedInspiration);

        // Store individual review
        review.clarity = clarity;
        review.innovation = innovation;
        review.inspiration = inspiration;
        review.tags = tags;
        review.qaDuration = qaDuration;
        review.timestamp = block.timestamp;

        emit ReviewSubmitted(sessionId, msg.sender);
    }

    /**
     * @notice Request decryption of aggregated scores (organizer only)
     * @param sessionId Session ID
     */
    function requestDecryption(uint256 sessionId) 
        external 
        onlyOrganizer(sessionId) 
    {
        require(sessions[sessionId].reviewCount > 0, "No reviews yet");
        
        Session storage session = sessions[sessionId];
        
        // Allow organizer to decrypt aggregated scores
        FHE.allow(session.aggregatedClarity, msg.sender);
        FHE.allow(session.aggregatedInnovation, msg.sender);
        FHE.allow(session.aggregatedInspiration, msg.sender);

        emit DecryptionRequested(sessionId);
    }

    /**
     * @notice Store decrypted aggregated scores (called after off-chain decryption)
     * @param sessionId Session ID
     * @param clarity Decrypted clarity sum
     * @param innovation Decrypted innovation sum
     * @param inspiration Decrypted inspiration sum
     */
    function storeDecryptedScores(
        uint256 sessionId,
        uint16 clarity,
        uint16 innovation,
        uint16 inspiration
    ) external onlyOrganizer(sessionId) {
        Session storage session = sessions[sessionId];
        session.decryptedClarity = clarity;
        session.decryptedInnovation = innovation;
        session.decryptedInspiration = inspiration;
        session.isDecrypted = true;
    }

    /**
     * @notice Close session (disable new reviews)
     * @param sessionId Session ID
     */
    function closeSession(uint256 sessionId) 
        external 
        onlyOrganizer(sessionId) 
    {
        sessions[sessionId].isActive = false;
        emit SessionClosed(sessionId);
    }

    /**
     * @notice Check if aggregated score exceeds threshold (encrypted comparison)
     * @param sessionId Session ID
     * @param threshold Threshold value
     * @return High quality indicator (encrypted boolean)
     */
    function isHighQuality(uint256 sessionId, uint16 threshold) 
        external 
        onlyOrganizer(sessionId) 
        returns (ebool) 
    {
        Session storage session = sessions[sessionId];
        euint16 totalScore = FHE.add(
            FHE.add(session.aggregatedClarity, session.aggregatedInnovation),
            session.aggregatedInspiration
        );
        return FHE.gt(totalScore, FHE.asEuint16(threshold));
    }

    // View functions
    function getSessionCount() external view returns (uint256) {
        return _sessionIdCounter;
    }

    function getSession(uint256 sessionId) external view returns (
        string memory title,
        address speaker,
        address organizer,
        uint256 timestamp,
        bool isActive,
        uint256 reviewCount,
        bool isDecrypted,
        uint16 decryptedClarity,
        uint16 decryptedInnovation,
        uint16 decryptedInspiration
    ) {
        Session storage session = sessions[sessionId];
        return (
            session.title,
            session.speaker,
            session.organizer,
            session.timestamp,
            session.isActive,
            session.reviewCount,
            session.isDecrypted,
            session.decryptedClarity,
            session.decryptedInnovation,
            session.decryptedInspiration
        );
    }

    function getAuthorizedAttendees(uint256 sessionId) 
        external 
        view 
        returns (address[] memory) 
    {
        return authorizedAttendees[sessionId];
    }

    function getReviewMetadata(uint256 sessionId, address reviewer) 
        external 
        view 
        returns (uint8 tags, uint16 qaDuration, uint256 timestamp) 
    {
        Review storage review = reviews[sessionId][reviewer];
        return (review.tags, review.qaDuration, review.timestamp);
    }
}


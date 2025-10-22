// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title PongEscrow
 * @notice Escrow contract for PONG-IT staking matches
 * @dev Uses pull-based payouts with backend signature verification
 */
contract PongEscrow is ReentrancyGuard, Pausable, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ Structs ============

    struct Match {
        address player1;
        address player2;
        uint256 stakeAmount;
        address winner;
        MatchStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    enum MatchStatus {
        NOT_CREATED,    // Default state
        PLAYER1_STAKED, // Player 1 has staked, waiting for player 2
        BOTH_STAKED,    // Both players staked, game in progress
        COMPLETED,      // Winner declared, prize claimed
        REFUNDED        // Match cancelled, funds returned
    }

    // ============ State Variables ============

    /// @notice Backend oracle address that signs winner declarations
    address public backendOracle;

    /// @notice Mapping from room code to Match struct
    mapping(string => Match) public matches;

    /// @notice Timeout for player 2 to join (10 minutes)
    uint256 public constant JOIN_TIMEOUT = 10 minutes;

    /// @notice Timeout for winner to claim prize (30 days)
    uint256 public constant CLAIM_TIMEOUT = 30 days;

    // ============ Events ============

    event MatchCreated(
        string indexed roomCode,
        address indexed player1,
        uint256 stakeAmount,
        uint256 timestamp
    );

    event PlayerJoined(
        string indexed roomCode,
        address indexed player2,
        uint256 totalPot,
        uint256 timestamp
    );

    event PrizeClaimed(
        string indexed roomCode,
        address indexed winner,
        uint256 amount,
        uint256 timestamp
    );

    event MatchRefunded(
        string indexed roomCode,
        address indexed player,
        uint256 amount,
        uint256 timestamp
    );

    event AbandonedMatchRefunded(
        string indexed roomCode,
        address indexed player,
        uint256 amount,
        uint256 timestamp
    );

    event ExpiredMatchRefunded(
        string indexed roomCode,
        address indexed player1,
        address indexed player2,
        uint256 amountEach,
        uint256 timestamp
    );

    event BackendOracleUpdated(
        address indexed oldOracle,
        address indexed newOracle,
        uint256 timestamp
    );

    // ============ Constructor ============

    constructor(address _backendOracle) Ownable(msg.sender) {
        require(_backendOracle != address(0), "Invalid oracle address");
        backendOracle = _backendOracle;
    }

    // ============ External Functions ============

    /**
     * @notice Player 1 creates a match and stakes ETH
     * @param roomCode Unique 6-character room code
     */
    function stakeAsPlayer1(string calldata roomCode)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        require(msg.value > 0, "Stake must be greater than 0");
        require(bytes(roomCode).length == 6, "Room code must be 6 characters");
        require(
            matches[roomCode].status == MatchStatus.NOT_CREATED,
            "Match already exists"
        );

        matches[roomCode] = Match({
            player1: msg.sender,
            player2: address(0),
            stakeAmount: msg.value,
            winner: address(0),
            status: MatchStatus.PLAYER1_STAKED,
            createdAt: block.timestamp,
            completedAt: 0
        });

        emit MatchCreated(roomCode, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Player 2 joins a match and stakes equal amount
     * @param roomCode Room code to join
     */
    function stakeAsPlayer2(string calldata roomCode)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        Match storage matchData = matches[roomCode];

        require(
            matchData.status == MatchStatus.PLAYER1_STAKED,
            "Match not available"
        );
        require(msg.sender != matchData.player1, "Cannot join own match");
        require(
            msg.value == matchData.stakeAmount,
            "Stake must match player 1"
        );

        matchData.player2 = msg.sender;
        matchData.status = MatchStatus.BOTH_STAKED;

        uint256 totalPot = matchData.stakeAmount * 2;

        emit PlayerJoined(roomCode, msg.sender, totalPot, block.timestamp);
    }

    /**
     * @notice Winner claims prize with backend signature (pull-based)
     * @param roomCode Room code for the match
     * @param signature Backend's signature proving msg.sender is the winner
     */
    function claimPrize(string calldata roomCode, bytes calldata signature)
        external
        nonReentrant
    {
        Match storage matchData = matches[roomCode];

        require(
            matchData.status == MatchStatus.BOTH_STAKED,
            "Match not ready for claiming"
        );
        require(matchData.winner == address(0), "Prize already claimed");

        // Verify backend signature
        bytes32 messageHash = keccak256(abi.encodePacked(roomCode, msg.sender));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);

        require(signer == backendOracle, "Invalid signature");

        // Update state before transfer (checks-effects-interactions)
        matchData.winner = msg.sender;
        matchData.status = MatchStatus.COMPLETED;
        matchData.completedAt = block.timestamp;

        uint256 prize = matchData.stakeAmount * 2;

        // Transfer prize to winner
        (bool success, ) = payable(msg.sender).call{value: prize}("");
        require(success, "Transfer failed");

        emit PrizeClaimed(roomCode, msg.sender, prize, block.timestamp);
    }

    /**
     * @notice Player 1 can claim refund if player 2 never joins
     * @param roomCode Room code to refund
     */
    function claimRefund(string calldata roomCode) external nonReentrant {
        Match storage matchData = matches[roomCode];

        require(
            matchData.status == MatchStatus.PLAYER1_STAKED,
            "Cannot refund this match"
        );
        require(msg.sender == matchData.player1, "Only player 1 can refund");
        require(
            block.timestamp >= matchData.createdAt + JOIN_TIMEOUT,
            "Join timeout not reached"
        );

        // Update state before transfer
        matchData.status = MatchStatus.REFUNDED;
        uint256 refundAmount = matchData.stakeAmount;

        // Transfer refund
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund failed");

        emit MatchRefunded(roomCode, msg.sender, refundAmount, block.timestamp);
    }

    /**
     * @notice Player 1 can claim immediate refund for abandoned match with backend signature
     * @dev This allows instant refunds when host leaves before anyone joins (no timeout)
     * @param roomCode Room code to refund
     * @param signature Backend's signature authorizing the refund
     */
    function claimRefundForAbandoned(
        string calldata roomCode,
        bytes calldata signature
    ) external nonReentrant {
        Match storage matchData = matches[roomCode];

        require(
            matchData.status == MatchStatus.PLAYER1_STAKED,
            "Match not in player1 staked state"
        );
        require(msg.sender == matchData.player1, "Only player 1 can claim refund");
        require(matchData.player2 == address(0), "Player 2 already joined");

        // Verify backend signature
        // Message format: keccak256(roomCode, player1Address, "ABANDONED")
        bytes32 messageHash = keccak256(
            abi.encodePacked(roomCode, msg.sender, "ABANDONED")
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);

        require(signer == backendOracle, "Invalid backend signature");

        // Update state before transfer
        matchData.status = MatchStatus.REFUNDED;
        uint256 refundAmount = matchData.stakeAmount;

        // Transfer refund
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund failed");

        emit AbandonedMatchRefunded(
            roomCode,
            msg.sender,
            refundAmount,
            block.timestamp
        );
    }

    /**
     * @notice Either player can claim refund if winner never claims (after 30 days)
     * @param roomCode Room code to refund
     */
    function claimExpiredMatchRefund(string calldata roomCode)
        external
        nonReentrant
    {
        Match storage matchData = matches[roomCode];

        require(
            matchData.status == MatchStatus.BOTH_STAKED,
            "Match not eligible for refund"
        );
        require(
            msg.sender == matchData.player1 || msg.sender == matchData.player2,
            "Not a player in this match"
        );
        require(
            matchData.completedAt == 0,
            "Match already completed"
        );

        // Need a way to determine game end time - could be set by backend call
        // For now, use createdAt + reasonable game time assumption (1 hour)
        require(
            block.timestamp >= matchData.createdAt + 1 hours + CLAIM_TIMEOUT,
            "Claim timeout not reached"
        );

        // Update state before transfers
        matchData.status = MatchStatus.REFUNDED;
        uint256 refundAmount = matchData.stakeAmount;

        // Refund both players
        (bool success1, ) = payable(matchData.player1).call{value: refundAmount}("");
        require(success1, "Refund to player 1 failed");

        (bool success2, ) = payable(matchData.player2).call{value: refundAmount}("");
        require(success2, "Refund to player 2 failed");

        emit ExpiredMatchRefunded(
            roomCode,
            matchData.player1,
            matchData.player2,
            refundAmount,
            block.timestamp
        );
    }

    // ============ Admin Functions ============

    /**
     * @notice Update backend oracle address
     * @param newOracle New oracle address
     */
    function updateBackendOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        address oldOracle = backendOracle;
        backendOracle = newOracle;

        emit BackendOracleUpdated(oldOracle, newOracle, block.timestamp);
    }

    /**
     * @notice Pause the contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Get match details
     * @param roomCode Room code to query
     * @return Match struct
     */
    function getMatch(string calldata roomCode)
        external
        view
        returns (Match memory)
    {
        return matches[roomCode];
    }

    /**
     * @notice Get match status
     * @param roomCode Room code to query
     * @return status Match status enum
     */
    function getMatchStatus(string calldata roomCode)
        external
        view
        returns (MatchStatus)
    {
        return matches[roomCode].status;
    }

    /**
     * @notice Check if a room code is available
     * @param roomCode Room code to check
     * @return available True if room code can be used
     */
    function isRoomCodeAvailable(string calldata roomCode)
        external
        view
        returns (bool)
    {
        return matches[roomCode].status == MatchStatus.NOT_CREATED;
    }

    // ============ Fallback Functions ============

    receive() external payable {
        revert("Direct transfers not allowed");
    }

    fallback() external payable {
        revert("Direct transfers not allowed");
    }
}

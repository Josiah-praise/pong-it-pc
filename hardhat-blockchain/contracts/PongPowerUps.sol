// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title PongPowerUps
 * @notice ERC-1155 contract that mints consumable boosts, handles daily loot crates,
 *         and supports time-boxed delegations (rentals) for PONG-IT.
 */
contract PongPowerUps is ERC1155Supply, AccessControl, Pausable, ReentrancyGuard {
    // =============================================================
    //                            ERRORS
    // =============================================================

    error InvalidAddress();
    error InvalidAmount();
    error InvalidExpiry();
    error CrateUnavailable();
    error CrateExpired();
    error InvalidReveal();
    error Unauthorized();
    error DelegationExpired();
    error DelegationInsufficient();
    error BalanceLocked(uint256 available, uint256 required);

    // =============================================================
    //                           CONSTANTS
    // =============================================================

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant GAME_ROLE = keccak256("GAME_ROLE");

    uint256 public constant BOOST_SPEED = 1;
    uint256 public constant BOOST_SHIELD = 2;
    uint256 public constant BOOST_MULTIBALL = 3;

    // Roll thresholds (0-99). Values represent inclusive upper bound.
    uint8 private constant COMMON_THRESHOLD = 59;   // 60%
    uint8 private constant RARE_THRESHOLD = 89;     // 30%
    // Remaining 10% -> Legendary

    // =============================================================
    //                            STRUCTS
    // =============================================================

    struct CrateInfo {
        bytes32 commitment;
        uint64 deadline;
    }

    struct Delegation {
        uint128 remaining;
        uint64 expiresAt;
    }

    // =============================================================
    //                           STORAGE
    // =============================================================

    mapping(address player => CrateInfo) private _pendingCrates;
    mapping(address owner => mapping(address user => mapping(uint256 id => Delegation))) private _delegations;
    mapping(address owner => mapping(uint256 id => uint256 locked)) private _lockedBalances;

    // =============================================================
    //                            EVENTS
    // =============================================================

    event BoostMinted(address indexed account, uint256 indexed id, uint256 amount, bytes32 context);
    event BoostConsumed(address indexed owner, address indexed operator, uint256 indexed id, uint256 amount);
    event DelegationCreated(
        address indexed owner,
        address indexed renter,
        uint256 indexed id,
        uint256 addedAmount,
        uint64 expiresAt,
        uint256 totalDelegated
    );
    event DelegationCancelled(address indexed owner, address indexed renter, uint256 indexed id, uint256 reclaimedAmount);
    event DelegationConsumed(
        address indexed owner,
        address indexed renter,
        address indexed operator,
        uint256 id,
        uint256 amount,
        uint256 remaining
    );
    event DailyCrateRegistered(address indexed player, bytes32 commitment, uint64 deadline);
    event DailyCrateOpened(address indexed player, uint256 indexed rewardId, uint8 roll);
    event DailyCrateCleared(address indexed player);

    // =============================================================
    //                         INTERNAL UTILS
    // =============================================================

    function _mintWithoutAcceptance(
        address to,
        uint256 id,
        uint256 amount
    ) internal {
        uint256[] memory ids = new uint256[](1);
        uint256[] memory values = new uint256[](1);
        ids[0] = id;
        values[0] = amount;
        _update(address(0), to, ids, values);
    }

    function _mintBatchWithoutAcceptance(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts
    ) internal {
        uint256 length = ids.length;
        uint256[] memory idsCopy = new uint256[](length);
        uint256[] memory valuesCopy = new uint256[](length);
        for (uint256 i = 0; i < length; ++i) {
            idsCopy[i] = ids[i];
            valuesCopy[i] = amounts[i];
        }
        _update(address(0), to, idsCopy, valuesCopy);
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    constructor(
        string memory baseURI,
        address initialAdmin,
        address initialMinter,
        address gameOperator
    ) ERC1155(baseURI) {
        address adminToSet = initialAdmin == address(0) ? msg.sender : initialAdmin;
        _grantRole(DEFAULT_ADMIN_ROLE, adminToSet);
        _grantRole(MINTER_ROLE, adminToSet);

        if (initialMinter != address(0)) {
            _grantRole(MINTER_ROLE, initialMinter);
        }

        if (gameOperator != address(0)) {
            _grantRole(GAME_ROLE, gameOperator);
        }

        if (adminToSet != msg.sender) {
            _grantRole(MINTER_ROLE, msg.sender);
            _grantRole(GAME_ROLE, msg.sender);
        }
    }

    // =============================================================
    //                         VIEW FUNCTIONS
    // =============================================================

    function pendingCrate(address player) external view returns (CrateInfo memory) {
        return _pendingCrates[player];
    }

    function getDelegation(address owner, address renter, uint256 id) external view returns (Delegation memory) {
        return _delegations[owner][renter][id];
    }

    function lockedBalanceOf(address owner, uint256 id) external view returns (uint256) {
        return _lockedBalances[owner][id];
    }

    // =============================================================
    //                       ADMINISTRATIVE
    // =============================================================

    function setURI(string memory newURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(newURI);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // =============================================================
    //                       BOOST MANAGEMENT
    // =============================================================

    function mintBoost(
        address to,
        uint256 id,
        uint256 amount,
        bytes32 context
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        if (to.code.length == 0) {
            _mint(to, id, amount, "");
        } else {
            _mintWithoutAcceptance(to, id, amount);
        }
        emit BoostMinted(to, id, amount, context);
    }

    function mintBatchBoost(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes32 context
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert InvalidAddress();
        if (ids.length != amounts.length || ids.length == 0) revert InvalidAmount();

        if (to.code.length == 0) {
            _mintBatch(to, ids, amounts, "");
        } else {
            _mintBatchWithoutAcceptance(to, ids, amounts);
        }
        for (uint256 i = 0; i < ids.length; ++i) {
            emit BoostMinted(to, ids[i], amounts[i], context);
        }
    }

    function consumeBoost(address owner, uint256 id, uint256 amount) external whenNotPaused nonReentrant {
        if (owner == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        if (msg.sender != owner && !hasRole(GAME_ROLE, msg.sender)) revert Unauthorized();

        _burn(owner, id, amount);
        emit BoostConsumed(owner, msg.sender, id, amount);
    }

    // =============================================================
    //                      DELEGATION (RENTALS)
    // =============================================================

    function delegateBoost(
        address renter,
        uint256 id,
        uint256 amount,
        uint64 expiresAt
    ) external whenNotPaused {
        if (renter == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (expiresAt <= block.timestamp) revert InvalidExpiry();

        uint256 available = balanceOf(msg.sender, id) - _lockedBalances[msg.sender][id];
        if (available < amount) revert BalanceLocked({available: available, required: amount});

        Delegation storage delegation = _delegations[msg.sender][renter][id];
        uint256 newRemaining = uint256(delegation.remaining) + amount;
        if (newRemaining > type(uint128).max) revert InvalidAmount();

        delegation.remaining = uint128(newRemaining);
        delegation.expiresAt = expiresAt;
        _lockedBalances[msg.sender][id] += amount;

        emit DelegationCreated(msg.sender, renter, id, amount, expiresAt, newRemaining);
    }

    function cancelDelegation(address renter, uint256 id) external whenNotPaused {
        Delegation storage delegation = _delegations[msg.sender][renter][id];
        uint256 remaining = delegation.remaining;
        if (remaining == 0) revert DelegationInsufficient();

        _lockedBalances[msg.sender][id] -= remaining;
        delete _delegations[msg.sender][renter][id];

        emit DelegationCancelled(msg.sender, renter, id, remaining);
    }

    function releaseExpiredDelegation(address owner, address renter, uint256 id) external whenNotPaused {
        Delegation storage delegation = _delegations[owner][renter][id];
        if (delegation.remaining == 0) revert DelegationInsufficient();
        if (block.timestamp <= delegation.expiresAt) revert InvalidExpiry();

        uint256 remaining = delegation.remaining;
        _lockedBalances[owner][id] -= remaining;
        delete _delegations[owner][renter][id];

        emit DelegationCancelled(owner, renter, id, remaining);
    }

    function consumeDelegatedBoost(
        address owner,
        address renter,
        uint256 id,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        if (owner == address(0) || renter == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        if (
            msg.sender != renter &&
            msg.sender != owner &&
            !hasRole(GAME_ROLE, msg.sender)
        ) {
            revert Unauthorized();
        }

        Delegation storage delegation = _delegations[owner][renter][id];
        if (delegation.remaining < amount) revert DelegationInsufficient();
        if (block.timestamp > delegation.expiresAt) revert DelegationExpired();

        delegation.remaining -= uint128(amount);
        _lockedBalances[owner][id] -= amount;
        _burn(owner, id, amount);

        emit DelegationConsumed(owner, renter, msg.sender, id, amount, delegation.remaining);

        if (delegation.remaining == 0) {
            delete _delegations[owner][renter][id];
            emit DelegationCancelled(owner, renter, id, 0);
        }
    }

    // =============================================================
    //                       DAILY CRATE LOGIC
    // =============================================================

    function registerDailyCrate(
        address player,
        bytes32 commitment,
        uint64 deadline
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (player == address(0)) revert InvalidAddress();
        if (commitment == bytes32(0)) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidExpiry();

        CrateInfo storage crate = _pendingCrates[player];
        if (crate.commitment != bytes32(0) && block.timestamp <= crate.deadline) {
            revert CrateUnavailable();
        }

        _pendingCrates[player] = CrateInfo({commitment: commitment, deadline: deadline});
        emit DailyCrateRegistered(player, commitment, deadline);
    }

    function clearExpiredCrate(address player) external whenNotPaused {
        CrateInfo storage crate = _pendingCrates[player];
        if (crate.commitment == bytes32(0)) revert CrateUnavailable();
        if (block.timestamp <= crate.deadline) revert InvalidExpiry();

        delete _pendingCrates[player];
        emit DailyCrateCleared(player);
    }

    function openDailyCrate(
        uint256 nonce,
        bytes32 serverSecret
    ) external whenNotPaused nonReentrant returns (uint256 rewardId) {
        CrateInfo storage crate = _pendingCrates[msg.sender];
        if (crate.commitment == bytes32(0)) revert CrateUnavailable();
        if (block.timestamp > crate.deadline) revert CrateExpired();

        bytes32 expected = keccak256(abi.encodePacked(msg.sender, nonce, serverSecret));
        if (expected != crate.commitment) revert InvalidReveal();

        delete _pendingCrates[msg.sender];
        emit DailyCrateCleared(msg.sender);

        bytes32 seed = keccak256(
            abi.encodePacked(serverSecret, msg.sender, blockhash(block.number - 1), block.prevrandao)
        );

        uint8 roll = uint8(uint256(seed) % 100);

        if (roll <= COMMON_THRESHOLD) {
            rewardId = BOOST_SPEED;
        } else if (roll <= RARE_THRESHOLD) {
            rewardId = BOOST_SHIELD;
        } else {
            rewardId = BOOST_MULTIBALL;
        }

        if (msg.sender.code.length == 0) {
            _mint(msg.sender, rewardId, 1, "");
        } else {
            _mintWithoutAcceptance(msg.sender, rewardId, 1);
        }
        emit DailyCrateOpened(msg.sender, rewardId, roll);
    }

    // =============================================================
    //                       INTERNAL OVERRIDES
    // =============================================================

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155Supply) whenNotPaused {
        if (from != address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                uint256 id = ids[i];
                uint256 amount = values[i];

                uint256 balance = balanceOf(from, id);
                uint256 locked = _lockedBalances[from][id];
                uint256 available = balance > locked ? balance - locked : 0;

                if (available < amount) {
                    revert BalanceLocked({available: available, required: amount});
                }
            }
        }

        super._update(from, to, ids, values);
    }
}

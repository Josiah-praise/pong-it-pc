// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PongEscrow.sol";

contract PongEscrowTest is Test {
    PongEscrow public escrow;
    
    address public owner;
    address public backendOracle;
    address public player1;
    address public player2;
    address public player3;
    
    uint256 public constant STAKE_AMOUNT = 0.1 ether;
    string public constant ROOM_CODE = "ABC123";
    
    // Backend oracle private key for signing
    uint256 public backendPrivateKey;
    
    event MatchCreated(string indexed roomCode, address indexed player1, uint256 stakeAmount, uint256 timestamp);
    event PlayerJoined(string indexed roomCode, address indexed player2, uint256 totalPot, uint256 timestamp);
    event PrizeClaimed(string indexed roomCode, address indexed winner, uint256 amount, uint256 timestamp);
    event MatchRefunded(string indexed roomCode, address indexed player, uint256 amount, uint256 timestamp);
    
    function setUp() public {
        owner = address(this);
        backendPrivateKey = 0xA11CE; // Test private key
        backendOracle = vm.addr(backendPrivateKey);
        player1 = makeAddr("player1");
        player2 = makeAddr("player2");
        player3 = makeAddr("player3");
        
        // Deploy contract
        escrow = new PongEscrow(backendOracle);
        
        // Fund test accounts
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
        vm.deal(player3, 10 ether);
    }
    
    // ============ Constructor Tests ============
    
    function test_Constructor() public view {
        assertEq(escrow.backendOracle(), backendOracle);
        assertEq(escrow.owner(), owner);
    }
    
    function test_ConstructorRevertsWithZeroAddress() public {
        vm.expectRevert("Invalid oracle address");
        new PongEscrow(address(0));
    }
    
    // ============ Match Creation Tests ============
    
    function test_StakeAsPlayer1() public {
        vm.prank(player1);
        vm.expectEmit(true, true, false, false);
        emit MatchCreated(ROOM_CODE, player1, STAKE_AMOUNT, block.timestamp);
        
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        PongEscrow.Match memory matchData = escrow.getMatch(ROOM_CODE);
        assertEq(matchData.player1, player1);
        assertEq(matchData.stakeAmount, STAKE_AMOUNT);
        assertEq(uint(matchData.status), uint(PongEscrow.MatchStatus.PLAYER1_STAKED));
    }
    
    function test_StakeAsPlayer1RevertsWithZeroStake() public {
        vm.prank(player1);
        vm.expectRevert("Stake must be greater than 0");
        escrow.stakeAsPlayer1{value: 0}(ROOM_CODE);
    }
    
    function test_StakeAsPlayer1RevertsWithInvalidRoomCode() public {
        vm.prank(player1);
        vm.expectRevert("Room code must be 6 characters");
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}("ABC"); // Only 3 characters
    }
    
    function test_StakeAsPlayer1RevertsIfMatchExists() public {
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        vm.prank(player3);
        vm.expectRevert("Match already exists");
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
    }
    
    // ============ Match Joining Tests ============
    
    function test_StakeAsPlayer2() public {
        // Player 1 creates match
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        // Player 2 joins
        vm.prank(player2);
        vm.expectEmit(true, true, false, false);
        emit PlayerJoined(ROOM_CODE, player2, STAKE_AMOUNT * 2, block.timestamp);
        
        escrow.stakeAsPlayer2{value: STAKE_AMOUNT}(ROOM_CODE);
        
        PongEscrow.Match memory matchData = escrow.getMatch(ROOM_CODE);
        assertEq(matchData.player2, player2);
        assertEq(uint(matchData.status), uint(PongEscrow.MatchStatus.BOTH_STAKED));
    }
    
    function test_StakeAsPlayer2RevertsIfMatchNotAvailable() public {
        vm.prank(player2);
        vm.expectRevert("Match not available");
        escrow.stakeAsPlayer2{value: STAKE_AMOUNT}(ROOM_CODE);
    }
    
    function test_StakeAsPlayer2RevertsIfPlayer1TriesToJoin() public {
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        vm.prank(player1);
        vm.expectRevert("Cannot join own match");
        escrow.stakeAsPlayer2{value: STAKE_AMOUNT}(ROOM_CODE);
    }
    
    function test_StakeAsPlayer2RevertsIfStakeMismatch() public {
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        vm.prank(player2);
        vm.expectRevert("Stake must match player 1");
        escrow.stakeAsPlayer2{value: STAKE_AMOUNT + 0.01 ether}(ROOM_CODE);
    }
    
    // ============ Prize Claiming Tests ============
    
    function test_ClaimPrize() public {
        // Setup match
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        vm.prank(player2);
        escrow.stakeAsPlayer2{value: STAKE_AMOUNT}(ROOM_CODE);
        
        // Backend signs winner (player1 wins)
        bytes memory signature = _signWinner(ROOM_CODE, player1);
        
        // Player1 claims prize
        uint256 balanceBefore = player1.balance;
        
        vm.prank(player1);
        vm.expectEmit(true, true, false, false);
        emit PrizeClaimed(ROOM_CODE, player1, STAKE_AMOUNT * 2, block.timestamp);
        
        escrow.claimPrize(ROOM_CODE, signature);
        
        uint256 balanceAfter = player1.balance;
        assertEq(balanceAfter - balanceBefore, STAKE_AMOUNT * 2);
        
        PongEscrow.Match memory matchData = escrow.getMatch(ROOM_CODE);
        assertEq(matchData.winner, player1);
        assertEq(uint(matchData.status), uint(PongEscrow.MatchStatus.COMPLETED));
    }
    
    function test_ClaimPrizeRevertsWithInvalidSignature() public {
        // Setup match
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        vm.prank(player2);
        escrow.stakeAsPlayer2{value: STAKE_AMOUNT}(ROOM_CODE);
        
        // Invalid signature (signed by wrong account)
        uint256 wrongKey = 0xBAD;
        bytes32 messageHash = keccak256(abi.encodePacked(ROOM_CODE, player1));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, ethSignedHash);
        bytes memory badSignature = abi.encodePacked(r, s, v);
        
        vm.prank(player1);
        vm.expectRevert("Invalid signature");
        escrow.claimPrize(ROOM_CODE, badSignature);
    }
    
    function test_ClaimPrizeRevertsIfAlreadyClaimed() public {
        // Setup and claim once
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);

        vm.prank(player2);
        escrow.stakeAsPlayer2{value: STAKE_AMOUNT}(ROOM_CODE);

        bytes memory signature = _signWinner(ROOM_CODE, player1);

        vm.prank(player1);
        escrow.claimPrize(ROOM_CODE, signature);

        // Try to claim again - status is COMPLETED now, not BOTH_STAKED
        vm.prank(player1);
        vm.expectRevert("Match not ready for claiming");
        escrow.claimPrize(ROOM_CODE, signature);
    }
    
    function test_ClaimPrizeRevertsIfLoserTriesToClaim() public {
        // Setup match
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        vm.prank(player2);
        escrow.stakeAsPlayer2{value: STAKE_AMOUNT}(ROOM_CODE);
        
        // Backend signs player1 as winner, but player2 tries to claim
        bytes memory signature = _signWinner(ROOM_CODE, player1);
        
        vm.prank(player2);
        vm.expectRevert("Invalid signature");
        escrow.claimPrize(ROOM_CODE, signature);
    }
    
    // ============ Refund Tests ============
    
    function test_ClaimRefund() public {
        // Player 1 creates match
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        // Fast forward past timeout
        vm.warp(block.timestamp + 11 minutes);
        
        uint256 balanceBefore = player1.balance;
        
        vm.prank(player1);
        vm.expectEmit(true, true, false, false);
        emit MatchRefunded(ROOM_CODE, player1, STAKE_AMOUNT, block.timestamp);
        
        escrow.claimRefund(ROOM_CODE);
        
        uint256 balanceAfter = player1.balance;
        assertEq(balanceAfter - balanceBefore, STAKE_AMOUNT);
        
        PongEscrow.Match memory matchData = escrow.getMatch(ROOM_CODE);
        assertEq(uint(matchData.status), uint(PongEscrow.MatchStatus.REFUNDED));
    }
    
    function test_ClaimRefundRevertsBeforeTimeout() public {
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        vm.prank(player1);
        vm.expectRevert("Join timeout not reached");
        escrow.claimRefund(ROOM_CODE);
    }
    
    function test_ClaimRefundRevertsIfNotPlayer1() public {
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        vm.warp(block.timestamp + 11 minutes);
        
        vm.prank(player2);
        vm.expectRevert("Only player 1 can refund");
        escrow.claimRefund(ROOM_CODE);
    }
    
    // ============ Admin Functions Tests ============
    
    function test_UpdateBackendOracle() public {
        address newOracle = makeAddr("newOracle");
        
        escrow.updateBackendOracle(newOracle);
        
        assertEq(escrow.backendOracle(), newOracle);
    }
    
    function test_UpdateBackendOracleRevertsIfNotOwner() public {
        address newOracle = makeAddr("newOracle");
        
        vm.prank(player1);
        vm.expectRevert();
        escrow.updateBackendOracle(newOracle);
    }
    
    function test_PauseAndUnpause() public {
        escrow.pause();
        
        vm.prank(player1);
        vm.expectRevert();
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        escrow.unpause();
        
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
    }
    
    // ============ View Functions Tests ============
    
    function test_IsRoomCodeAvailable() public {
        assertTrue(escrow.isRoomCodeAvailable(ROOM_CODE));
        
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        assertFalse(escrow.isRoomCodeAvailable(ROOM_CODE));
    }
    
    function test_GetMatchStatus() public {
        assertEq(uint(escrow.getMatchStatus(ROOM_CODE)), uint(PongEscrow.MatchStatus.NOT_CREATED));
        
        vm.prank(player1);
        escrow.stakeAsPlayer1{value: STAKE_AMOUNT}(ROOM_CODE);
        
        assertEq(uint(escrow.getMatchStatus(ROOM_CODE)), uint(PongEscrow.MatchStatus.PLAYER1_STAKED));
    }
    
    // ============ Helper Functions ============
    
    function _signWinner(string memory roomCode, address winner) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(roomCode, winner));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendPrivateKey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }
}

const { ethers } = require('ethers');

class SignatureService {
  constructor() {
    this.wallet = null;
    this.initializeWallet();
  }

  initializeWallet() {
    const privateKey = process.env.SIGNING_WALLET_PRIVATE_KEY;

    if (!privateKey || privateKey === 'YOUR_PRIVATE_KEY_HERE') {
      console.error('⚠️  SIGNING_WALLET_PRIVATE_KEY not configured in .env');
      console.error('⚠️  Signature generation will be disabled');
      return;
    }

    try {
      this.wallet = new ethers.Wallet(privateKey);
      console.log('✅ Signature service initialized');
      console.log('📝 Signer address:', this.wallet.address);
    } catch (error) {
      console.error('❌ Failed to initialize signing wallet:', error.message);
    }
  }

  /**
   * Sign winner proof for claiming prize
   * IMPORTANT: This MUST match the smart contract's signature verification:
   * keccak256(abi.encodePacked(roomCode, winnerAddress))
   *
   * @param {string} roomCode - The game room code
   * @param {string} winnerAddress - Ethereum address of the winner
   * @param {string} stakeAmount - Stake amount (not used in signature, but logged)
   * @returns {Promise<string>} - Signature hex string
   */
  async signWinner(roomCode, winnerAddress, stakeAmount) {
    if (!this.wallet) {
      throw new Error('Signing wallet not initialized. Check SIGNING_WALLET_PRIVATE_KEY in .env');
    }

    try {
      // Pack the data exactly as the smart contract expects:
      // keccak256(abi.encodePacked(roomCode, winnerAddress))
      const messageHash = ethers.solidityPackedKeccak256(
        ['string', 'address'],
        [roomCode, winnerAddress]
      );

      // Sign the message hash (this automatically applies EIP-191 prefix)
      const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));

      console.log('✅ Winner signature generated:', {
        roomCode,
        winner: winnerAddress,
        stakeAmount,
        messageHash,
        signaturePreview: signature.slice(0, 10) + '...',
        signerAddress: this.wallet.address
      });

      return signature;
    } catch (error) {
      console.error('❌ Failed to sign winner proof:', error);
      throw error;
    }
  }

  /**
   * Get the signer's Ethereum address
   * @returns {string|null} - Signer address or null if not initialized
   */
  getSignerAddress() {
    return this.wallet ? this.wallet.address : null;
  }

  /**
   * Check if signature service is ready
   * @returns {boolean}
   */
  isReady() {
    return this.wallet !== null;
  }
}

// Export singleton instance
module.exports = new SignatureService();

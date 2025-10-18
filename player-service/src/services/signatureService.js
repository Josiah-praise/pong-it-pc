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
   * @param {string} roomCode - The game room code
   * @param {string} winnerAddress - Ethereum address of the winner
   * @param {string} stakeAmount - Stake amount in ETH (e.g., "0.01")
   * @returns {Promise<string>} - Signature hex string
   */
  async signWinner(roomCode, winnerAddress, stakeAmount) {
    if (!this.wallet) {
      throw new Error('Signing wallet not initialized. Check SIGNING_WALLET_PRIVATE_KEY in .env');
    }

    // EIP-712 domain separator (must match contract)
    const domain = {
      name: 'PongEscrow',
      version: '1',
      chainId: parseInt(process.env.CHAIN_ID || '4202'),
      verifyingContract: process.env.CONTRACT_ADDRESS
    };

    // Type definitions (must match contract)
    const types = {
      Winner: [
        { name: 'roomCode', type: 'string' },
        { name: 'winner', type: 'address' },
        { name: 'stakeAmount', type: 'uint256' }
      ]
    };

    // Values to sign
    const value = {
      roomCode,
      winner: winnerAddress,
      stakeAmount: ethers.parseEther(stakeAmount)
    };

    try {
      const signature = await this.wallet.signTypedData(domain, types, value);

      console.log('✅ Winner signature generated:', {
        roomCode,
        winner: winnerAddress,
        stakeAmount,
        signaturePreview: signature.slice(0, 10) + '...'
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

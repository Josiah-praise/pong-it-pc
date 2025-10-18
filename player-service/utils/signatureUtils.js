const { ethers } = require('ethers');

/**
 * Generates a signature for prize claiming
 * @param {string} roomCode - The 6-character room code
 * @param {string} winnerAddress - The Ethereum address of the winner
 * @param {string} privateKey - The backend's private key for signing
 * @returns {string} The signature in hex format
 */
function generatePrizeSignature(roomCode, winnerAddress, privateKey) {
  try {
    // Create a wallet from the private key
    const wallet = new ethers.Wallet(privateKey);

    // Pack the data exactly as the smart contract expects:
    // keccak256(abi.encodePacked(roomCode, winnerAddress))
    const messageHash = ethers.solidityPackedKeccak256(
      ['string', 'address'],
      [roomCode, winnerAddress]
    );

    // Sign the message hash (this automatically applies EIP-191 prefix)
    const signature = wallet.signMessageSync(ethers.getBytes(messageHash));

    console.log(`✅ Generated signature for room ${roomCode}, winner ${winnerAddress}`);
    console.log(`   Message hash: ${messageHash}`);
    console.log(`   Signature: ${signature}`);

    return signature;
  } catch (error) {
    console.error('❌ Error generating signature:', error);
    throw new Error(`Failed to generate signature: ${error.message}`);
  }
}

/**
 * Verifies a signature matches the expected signer
 * @param {string} roomCode - The 6-character room code
 * @param {string} winnerAddress - The Ethereum address of the winner
 * @param {string} signature - The signature to verify
 * @param {string} expectedSigner - The address that should have signed
 * @returns {boolean} True if signature is valid
 */
function verifyPrizeSignature(roomCode, winnerAddress, signature, expectedSigner) {
  try {
    // Pack the data the same way
    const messageHash = ethers.solidityPackedKeccak256(
      ['string', 'address'],
      [roomCode, winnerAddress]
    );

    // Recover the signer's address
    const recoveredAddress = ethers.verifyMessage(
      ethers.getBytes(messageHash),
      signature
    );

    const isValid = recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();

    console.log(`🔍 Signature verification:`);
    console.log(`   Expected signer: ${expectedSigner}`);
    console.log(`   Recovered signer: ${recoveredAddress}`);
    console.log(`   Valid: ${isValid}`);

    return isValid;
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    return false;
  }
}

module.exports = {
  generatePrizeSignature,
  verifyPrizeSignature
};

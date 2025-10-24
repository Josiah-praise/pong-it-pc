import { type FC, useState, useEffect } from 'react';
import { usePushWalletContext, usePushChainClient } from '@pushchain/ui-kit';
import { getPlayerByWallet } from '../services/authService';
import '../styles/AddressDisplay.css';

const AddressDisplay: FC = () => {
  const { connectionStatus, universalAccount } = usePushWalletContext();
  const { pushChainClient } = usePushChainClient();
  const isConnected = connectionStatus === 'connected';
  const [username, setUsername] = useState<string | null>(null);

  // Get wallet address
  const walletAddress = pushChainClient?.universal?.account?.toLowerCase() || null;

  // Fetch username from database based on wallet address
  useEffect(() => {
    const fetchUsername = async () => {
      if (!walletAddress) {
        setUsername(null);
        return;
      }

      try {
        const player = await getPlayerByWallet(walletAddress);
        setUsername(player?.name || null);
      } catch (error) {
        setUsername(null);
      }
    };

    fetchUsername();
  }, [walletAddress]);

  if (!isConnected || !username) return null;

  // Get UEA (Universal Executor Account) from Push Chain
  const uea = pushChainClient?.universal?.account?.toLowerCase() || null;
  
  // Get origin address from universalAccount CAIP format (eip155:chainId:address)
  const caipAddress = universalAccount?.caipAddress;
  const originAddress = caipAddress?.split(':')[2]?.toLowerCase() || null;

  // If UEA and origin are the same, it's a regular EOA wallet
  const isEOA = uea && originAddress && uea === originAddress;

  if (!uea) return null;

  return (
    <div className="address-display">
      {/* Username */}
      <div className="address-row username-row">
        <span className="username-value">👤 {username}</span>
      </div>
      
      {isEOA ? (
        // Show only EOA for regular wallets
        <div className="address-row">
          <span className="address-label">Address:</span>
          <span className="address-value" title={uea}>
            {uea.slice(0, 6)}...{uea.slice(-4)}
          </span>
        </div>
      ) : (
        // Show both UEA and Origin for Push Chain wallets
        <>
          <div className="address-row">
            <span className="address-label">UEA:</span>
            <span className="address-value" title={uea}>
              {uea.slice(0, 6)}...{uea.slice(-4)}
            </span>
          </div>
          {originAddress && (
            <div className="address-row">
              <span className="address-label">Origin:</span>
              <span className="address-value" title={originAddress}>
                {originAddress.slice(0, 6)}...{originAddress.slice(-4)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddressDisplay;


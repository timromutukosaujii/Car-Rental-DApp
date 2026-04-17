import { Link } from "react-router-dom";
import Logo from "../images/logo/logo.png";
import React, { useState, useEffect } from 'react';

function Navbar() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [walletError, setWalletError] = useState('');

  useEffect(() => {
    checkWalletConnection();

    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          setWalletError('');
        } else {
          setWalletAddress('');
          setIsConnected(false);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          setWalletError('');
        } else {
          setIsConnected(false);
        }
      } catch (err) {
        setWalletError('Unable to check wallet connection.');
        console.error(err.message);
      }
    } else {
      setWalletError('MetaMask was not detected. Please install or enable it.');
      setIsConnected(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          setWalletError('');
        } else {
          setIsConnected(false);
        }
      } catch (err) {
        if (err.code === 4001) {
          setWalletError('Connection request was rejected in MetaMask.');
        } else {
          setWalletError('Wallet connection failed. Please try again.');
        }
        console.error(err.message);
      }
    } else {
      setWalletError('MetaMask was not detected. Please install or enable it.');
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setIsConnected(false);
    setWalletError('');
  };

  return (
    <>
      <nav>
        <div className="navbar">
          <div className="navbar__img">
            <Link to="/" onClick={() => window.scrollTo(0, 0)}>
              <img src={Logo} alt="logo-img" />
            </Link>
          </div>
          <div className="navbar__buttons">
          <button
                className="navbar__buttons__connect"
                onClick={isConnected ? disconnectWallet : connectWallet}
              >
                {isConnected ? (
                  <>
                    <span>Connected:</span>
                    {` ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`}
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </button>
          </div>
        </div>
        {walletError && <p className="wallet-error">{walletError}</p>}
      </nav>
    </>
  );
}

export default Navbar;

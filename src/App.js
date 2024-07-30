import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import Membership from './contracts/Membership.json';
import Voting from './contracts/Voting.json';
import WizardToken from './contracts/WizardToken.json';
import StakingPool from './contracts/StakingPool.json';
import { Container, Form, Button, Card, ListGroup, Alert } from 'react-bootstrap';

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [members, setMembers] = useState([]);
  const [role, setRole] = useState('');
  const [stakeTokenId, setStakeTokenId] = useState('');
  const [pendingRewards, setPendingRewards] = useState(0);
  const [sellAmount, setSellAmount] = useState('');
  const [message, setMessage] = useState('');
  const [wizardToken, setWizardToken] = useState(null);
  const [stakingPool, setStakingPool] = useState(null);

  const loadBlockchainData = async () => {
    if (!web3) return;

    const accounts = await web3.eth.requestAccounts();
    setAccount(accounts[0]);

    const networkId = await web3.eth.net.getId();
    if (networkId !== 1) {
      setMessage('Please connect to the Ethereum Mainnet.');
      return;
    }

    const membershipData = Membership.networks[networkId];
    const votingData = Voting.networks[networkId];
    const tokenData = WizardToken.networks[networkId];
    const stakingData = StakingPool.networks[networkId];

    if (membershipData && votingData && tokenData && stakingData) {
      const membership = new web3.eth.Contract(Membership.abi, membershipData.address);
      const voting = new web3.eth.Contract(Voting.abi, votingData.address);
      const token = new web3.eth.Contract(WizardToken.abi, tokenData.address);
      const staking = new web3.eth.Contract(StakingPool.abi, stakingData.address);

      setWizardToken(token);
      setStakingPool(staking);

      const memberAddresses = await membership.methods.getMembers().call();
      setMembers(memberAddresses);

      const memberInfo = await voting.methods.getMemberInfo(accounts[0]).call();
      setPendingRewards(web3.utils.fromWei(memberInfo.unclaimedETH, 'ether'));
    }
  };

  useEffect(() => {
    const initWeb3 = async () => {
      const provider = await detectEthereumProvider();
      if (provider) {
        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);
        provider.on('accountsChanged', (accounts) => {
          setAccount(accounts[0]);
          loadBlockchainData();
        });
        provider.on('chainChanged', (_chainId) => window.location.reload());
      } else {
        console.log('Please install MetaMask!');
      }
    };

    initWeb3();
  }, []);

  useEffect(() => {
    if (web3) {
      loadBlockchainData();
    }
  }, [web3]);

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      loadBlockchainData();
    } catch (error) {
      console.error(error);
    }
  };

  const verifyOwnership = async () => {
    const networkId = await web3.eth.net.getId();
    if (networkId !== 1) {
      setMessage('Please connect to the Ethereum Mainnet.');
      return;
    }
    const membership = new web3.eth.Contract(Membership.abi, Membership.networks[networkId].address);
    const isOwner = await membership.methods.verifyOwnership().call({ from: account });
    if (isOwner) {
      wizardToken.methods.mint(account, web3.utils.toWei('1', 'ether')).send({ from: account });
      setMessage('Successfully verified ownership and minted 1 WIZARD token!');
    } else {
      setMessage('You do not own a wizard hat NFT.');
    }
  };

  const stakeNFT = async () => {
    const networkId = await web3.eth.net.getId();
    if (networkId !== 1) {
      setMessage('Please connect to the Ethereum Mainnet.');
      return;
    }
    const stakingPool = new web3.eth.Contract(StakingPool.abi, StakingPool.networks[networkId].address);
    const tokenId = stakeTokenId;
    await stakingPool.methods.stake(tokenId).send({ from: account });
    setMessage('Successfully staked the NFT!');
    loadBlockchainData();
  };

  const claimRewards = async () => {
    const networkId = await web3.eth.net.getId();
    if (networkId !== 1) {
      setMessage('Please connect to the Ethereum Mainnet.');
      return;
    }
    const stakingPool = new web3.eth.Contract(StakingPool.abi, StakingPool.networks[networkId].address);
    await stakingPool.methods.claimRewards().send({ from: account });
    setMessage('Successfully claimed rewards!');
    loadBlockchainData();
  };

  const sellVotingTokens = async () => {
    const networkId = await web3.eth.net.getId();
    if (networkId !== 1) {
      setMessage('Please connect to the Ethereum Mainnet.');
      return;
    }
    const wizardToken = new web3.eth.Contract(WizardToken.abi, WizardToken.networks[networkId].address);
    await wizardToken.methods.transfer(account, web3.utils.toWei(sellAmount, 'ether')).send({ from: account });
    setMessage('Successfully sold voting tokens!');
    loadBlockchainData();
  };

  const addMember = async () => {
    const networkId = await web3.eth.net.getId();
    if (networkId !== 1) {
      setMessage('Please connect to the Ethereum Mainnet.');
      return;
    }
    const membership = new web3.eth.Contract(Membership.abi, Membership.networks[networkId].address);
    await membership.methods.addMember(role).send({ from: account });
    setMessage('Successfully added member!');
    loadBlockchainData();
  };

  return (
    <Container>
      <h1 className="mt-4">The Collective</h1>
      {account ? (
        <>
          <p>Connected Account: {account}</p>
          <Button variant="primary" onClick={verifyOwnership}>Verify Ownership & Mint Token</Button>
        </>
      ) : (
        <Button variant="primary" onClick={connectWallet}>Connect Wallet</Button>
      )}

      {message && <Alert variant="success">{message}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Join the Collective</Card.Title>
          <Form>
            <Form.Group controlId="formRole">
              <Form.Label>Role</Form.Label>
              <Form.Control
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Enter your role"
              />
            </Form.Group>
            <Button variant="primary" onClick={addMember}>Join Collective</Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Stake NFT</Card.Title>
          <Form>
            <Form.Group controlId="formStakeTokenId">
              <Form.Label>Token ID</Form.Label>
              <Form.Control
                type="text"
                value={stakeTokenId}
                onChange={(e) => setStakeTokenId(e.target.value)}
                placeholder="Enter Token ID to stake"
              />
            </Form.Group>
            <Button variant="primary" onClick={stakeNFT}>Stake NFT</Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Claim Rewards</Card.Title>
          <p>Pending Rewards: {pendingRewards} ETH</p>
          <Button variant="primary" onClick={claimRewards}>Claim Rewards</Button>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Sell Voting Tokens</Card.Title>
          <Form>
            <Form.Group controlId="formSellAmount">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="text"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="Enter amount of voting tokens to sell"
              />
            </Form.Group>
            <Button variant="primary" onClick={sellVotingTokens}>Sell Voting Tokens</Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Members</Card.Title>
          <ListGroup>
            {members.map((member, index) => (
              <ListGroup.Item key={index}>{member}</ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default App;

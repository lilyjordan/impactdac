'use client'

import React from 'react';
import { ethers } from "ethers";
import DACFactoryArtifact from '../artifacts/DAC.sol/DACFactory.json';
import DACArtifact from '../artifacts/DAC.sol/DAC.json';
import dynamic from 'next/dynamic';
import { AppState, Network, EnumDefinitions } from './types';
import { ContractCard } from './components/ContractCard';
import { SponsorModal } from './components/SponsorModal';
import { ContractModal } from './components/ContractModal';
import rawEnums from '../public/enum_definitions.json';
import { getDescription } from './utils';


const Enums: EnumDefinitions = rawEnums;


const NETWORK_IDS: Network = {
  hardhat: '31337',
  anvil: '31337',
  sepolia: '11155111',
  goerli: '5',
  polygon_mainnet: '137'
}

const NETWORK_NAMES: Network = {
  hardhat: 'Hardhat',
  anvil: 'Anvil',
  sepolia: 'Sepolia Testnet',
  goerli: 'Goerli Testnet',
  polygon_mainnet: 'Polygon Mainnet'
}

declare global {
  interface Window {
    ethereum: any;
  }
}

const network: keyof Network | undefined = process.env.NEXT_PUBLIC_NETWORK;

export class Home extends React.Component<{}, AppState> {
  private provider?: ethers.BrowserProvider;
  private signer?: ethers.Signer;
  private DACFactory?: ethers.Contract;
  private DACFactoryAddress?: string

  private initialState: AppState = {
    userAddress: undefined,
    contracts: {},
    txBeingSent: undefined,
    messageDuringTx: undefined,
    transactionError: undefined,
    networkError: undefined,
    formContribute: {
      dacAddress: "",
      amount: "",
    },
    formApprovePayout: {
      dacAddressPayout: "",
      founder: "",
    },
    formRefund: {
      dacAddressRefund: "",
    },
    formClaimComp: {
      dacAddressClaim: "",
    },
    showSponsorModal: false,
    activeContractModal: null
  };

  state = this.initialState;


  componentDidMount() {
    this._initializeEthers()
    .then(this._connectWallet);
  }


  async _initializeEthers() {
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    fetch("/run-latest.json")
    .then(response => response.json())
    .then(json => {
        this.DACFactoryAddress = json.transactions[0].contractAddress;

        this.DACFactory = new ethers.Contract(
          this.DACFactoryAddress!,
          DACFactoryArtifact.abi,
          this.signer
        );

      return this.DACFactory.waitForDeployment();
    })
    .then(() => {
      this._updateContracts();
    });
  }


  async _updateContracts(addressToUpdate?: string) {
    if (!this.DACFactory || !this.provider) {
      return;
    }
  
    let contractAddresses = await this.DACFactory.getContracts();
    console.log('contractAddresses:', contractAddresses);
    let newContracts = { ...this.state.contracts };    
    
    // Update a particular contract if its address is provided
    if (addressToUpdate) {
      const c = new ethers.Contract(
        addressToUpdate,
        DACArtifact.abi,
        this.signer
      );
      const amountPledged = await c.totalContributions();
      if (newContracts[addressToUpdate]) {
        newContracts[addressToUpdate].amountPledged = amountPledged;
      }
    }
  
    // Add new contracts
    for (const addr of contractAddresses) {
      if (!newContracts.hasOwnProperty(addr)) {
        const c = new ethers.Contract(
          addr,
          DACArtifact.abi,
          this.signer
        );
        const sponsor = await c.sponsor();
        const arbitrator = await c.arbitrator();
        const deadline = await c.deadline();
        const goal = await c.goal();
        const contribCompPct = await c.contribCompPct();
        const sponsorCompPct = await c.sponsorCompPct();
        const title = await c.title();

        const description = await getDescription(addr);  // TODO handle a db error

        // TODO mystery error?
        // maybe when user isn't logged in? but connection looks ok
        // happens on second load, it looks like
        const userContribution = await c.contributions(
          this.state.userAddress);

        let rawFundingState = await c.state();
        const fundingState = Enums['State'][rawFundingState];

        const amountPledged = await c.totalContributions();
        newContracts[addr] = {
          contract: c,
          address: addr,
          sponsor: sponsor,
          arbitrator: arbitrator,
          deadline: deadline,
          goal: goal,
          contribCompPct: contribCompPct,
          sponsorCompPct: sponsorCompPct,
          title: title,
          description: description,
          fundingState: fundingState,
          amountPledged: amountPledged,
          userContribution: userContribution
        }
      }
    }
    
    // Remove deleted contracts
    for (const addr in newContracts) {
      if (!contractAddresses.includes(addr)) {
        delete newContracts[addr];
      }
    }

    // See if any contracts have expired
    for (const addr in newContracts) {
      const contractData = newContracts[addr];
      // We could do this whole check by making `checkFailure`
      // on the contract itself public and calling that,
      // but it costs gas, so I think this is the least
      // annoying way around that for now.
      if (contractData.fundingState === 'Funding') {
        if (Date.now() > contractData.deadline * BigInt(1000)) {
          contractData.fundingState = 'Failed';
        }
      }
    }
  
    this.setState({ contracts: newContracts });
  }


  _resetState() {
    this.setState(this.initialState);
  }

  _connectWallet = async () => {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(async (addresses: string[]) => {
      this.setState({userAddress: addresses[0]});
      const balance = await this.provider!.getBalance(addresses[0]);
    });
    if (!this._checkNetwork()) {
      return;
    }

    window.ethereum.on("accountsChanged", ([newAddress]: [string]) => {
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      window.ethereum.request({ method: 'eth_requestAccounts' }).then((addr: string) => this.setState({userAddress: addr}));
    });
    
    this.provider!.on("network", ([chainId]: [string]) => {
      this._resetState();
    });
  }

  _checkNetwork = () => {
    if (!network) {
      throw new Error('Network is not defined in environment variables')
    }

    if (parseInt(window.ethereum.chainId, 16).toString() === NETWORK_IDS[network]) {
      return true;
    }

    this.setState({ 
      networkError: `Connect to ${NETWORK_NAMES[network]}`
    });

    return false;
  }


  toggleSponsorModal = () => {
    this.setState({ showSponsorModal: !this.state.showSponsorModal });
  };


  openContractModal = (addr: string) => {
    this.setState({ activeContractModal: addr });
  };


  closeContractModal = () => {
    this.setState({ activeContractModal: null })
  }


  handleDACCreated = () => {
    this.toggleSponsorModal();
    this._updateContracts();
  }


  handlePledgeAdded = (addr: string) => {
    this.closeContractModal();
    this._updateContracts(addr);
  }


  // Function to contribute to the DAC
  async contribute(dac: ethers.Contract, amount: number) {
      let transaction = await dac.contribute({ value: ethers.parseEther(amount.toString()) });
      await transaction.wait();
  }

  // Function to approve the payout
  async approvePayout(dac: ethers.Contract, founder: string) {
      let transaction = await dac.approvePayout(founder);
      await transaction.wait();
  }

  // Function to refund the contribution
  async refund(dac: ethers.Contract) {
      let transaction = await dac.refund();
      await transaction.wait();
  }

  // Function to claim unowed contribution compensation
  async claimUnowedContribComp(dac: ethers.Contract) {
      let transaction = await dac.claimUnowedContribComp();
      await transaction.wait();
  }

  handleContributeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({ formContribute: { ...this.state.formContribute, [name]: value } });
  }

  handleApprovePayoutChange(event: React.ChangeEvent<HTMLInputElement>) {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({ formApprovePayout: { ...this.state.formApprovePayout, [name]: value } });
  }

  handleRefundChange(event: React.ChangeEvent<HTMLInputElement>) {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({ formRefund: { ...this.state.formRefund, [name]: value } });
  }

  handleClaimCompChange(event: React.ChangeEvent<HTMLInputElement>) {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({ formClaimComp: { ...this.state.formClaimComp, [name]: value } });
  }

  render() {
    const contracts = Object.entries(this.state.contracts).map(([key, value]) => (
        <ContractCard
          key={key}
          contractData={value}
          signer={this.signer!}
          openContractModal={this.openContractModal}
        />
    ));

    return (
      <div>
        <div className="m-20 text-right">
          <h3>{this.DACFactoryAddress && 'Connected'}</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] \
            justify-items-center mx-auto bg-goldenrod-darker gap-8 \
            p-8 mb-8"
          >
            {contracts}
          </div>
          <button
            className="bg-goldenrod-darker hover:bg-goldenrod-darkest \
              text-goldenrod-lightest font-bold py-2 px-4 rounded w-44 \
              ml-auto"
            onClick={this.toggleSponsorModal}
          >
            Sponsor a Bounty
          </button>
        </div>
        {this.state.showSponsorModal && (
          <SponsorModal
            DACFactory={this.DACFactory}
            DACFactoryAddress={this.DACFactoryAddress}
            provider={this.provider}
            signer={this.signer}
            onDACCreated={this.handleDACCreated}
            onClose={this.toggleSponsorModal}
          />
        )}
        {this.state.activeContractModal && (
          <ContractModal
            contractData={this.state.contracts[this.state.activeContractModal]}
            userAddress={this.state.userAddress}
            signer={this.signer!}
            onPledgeAdded={this.handlePledgeAdded}
            onClose={this.closeContractModal}
          />
        )}

        <div className="m-4">
          <h1>Refund</h1>
          <form id="refundForm">
              <label htmlFor="dacAddressRefund">DAC Address:</label><br />
              <input type="text" id="dacAddressRefund" name="dacAddressRefund" /><br />
              <input className="text-green-500" type="submit" value="Refund" />
          </form>
        </div>

        <div className="m-4">
          <h1>Claim Unowed Contribution Compensation</h1>
          <form id="claimCompForm">
              <label htmlFor="dacAddressClaim">DAC Address:</label><br />
              <input type="text" id="dacAddressClaim" name="dacAddressClaim" /><br />
              <input className="text-green-500" type="submit" value="Claim Compensation" />
          </form>
        </div>
      </div>
    );
  }
}

const NoSSRApp = dynamic(() => Promise.resolve(Home), { ssr: false });

function Page() {
  return <NoSSRApp />;
}

export default Page;
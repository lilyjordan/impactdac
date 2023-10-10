'use client'

import React from 'react';
import { ethers } from "ethers";
import DACFactoryArtifact from '../artifacts/DAC.sol/DACFactory.json';
import DACArtifact from '../artifacts/DAC.sol/DAC.json';
import dynamic from 'next/dynamic';
import { ContributeForm, ApprovePayoutForm, RefundForm,
  ClaimCompForm, AppState, Network, ContractData } from './types';
import { ContractCard } from './components/ContractCard';
import { SponsorModal } from './components/SponsorModal';
import { ContractModal } from './components/ContractModal';
import Link from 'next/link';


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
    selectedAddress: undefined,
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

  constructor(props: {}) {
    super(props);
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

  async _updateContracts() {
    if (!this.DACFactory) {
      return;
    }
    if (!this.provider) {
      return;
    }
    let contractAddresses = await this.DACFactory.getContracts();
    let newContracts: { [key: string]: ContractData } = {};
    for (const addr of contractAddresses) {
      if (this.state.contracts.hasOwnProperty(addr)) {
        newContracts[addr] = this.state.contracts[addr];
      } else {
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
        const fundingState = await c.state();
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
          fundingState: fundingState,
          amountPledged: amountPledged
        }
      }
    }
    this.setState({contracts: newContracts});
  }

  _resetState() {
    this.setState(this.initialState);
  }

  _connectWallet = async () => {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(async (addresses: string[]) => {
      this.setState({selectedAddress: addresses[0]});
      const balance = await this.provider!.getBalance(addresses[0]);
    });
    if (!this._checkNetwork()) {
      return;
    }

    window.ethereum.on("accountsChanged", ([newAddress]: [string]) => {
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      window.ethereum.request({ method: 'eth_requestAccounts' }).then((addr: string) => this.setState({selectedAddress: addr}));
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


  handlePledgeAdded = () => {
    this.closeContractModal();
    this._updateContracts();
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
          <div className="m-4">
            <h3>DACFactoryAddress: {this.DACFactoryAddress}</h3>
            <div className="flex flex-wrap w-[80%] mx-auto bg-goldenrod-darker">
              {contracts}
            </div>
          </div>
          {this.state.showSponsorModal && (
            <SponsorModal
              DACFactory={this.DACFactory}
              DACFactoryAddress={this.DACFactoryAddress}
              provider={this.provider}
              signer={this.signer}
              onDACCreated={this.handleDACCreated}
              onClickX={this.toggleSponsorModal}
            />
          )}
          {this.state.activeContractModal && (
            <ContractModal
              contractData={this.state.contracts[this.state.activeContractModal]}
              signer={this.signer!}
              onPledgeAdded={this.handlePledgeAdded}
              onClickX={this.closeContractModal}
            />
          )}
          <button onClick={this.toggleSponsorModal}>
            <div className="bg-goldenrod-darker hover:bg-goldenrod-darkest \
              text-goldenrod-lightest font-bold py-2 px-4 rounded w-44"
            >
              Sponsor a Bounty
            </div>
          </button>
  
          <div className="m-4">
            <h1>Approve Payout</h1>
            <form id="approvePayoutForm">
                <label htmlFor="dacAddressPayout">DAC Address:</label><br />
                <input type="text" id="dacAddressPayout" name="dacAddressPayout" /><br />
                <label htmlFor="founder">Founder:</label><br />
                <input type="text" id="founder" name="founder" /><br />
                <input className="text-green-500" type="submit" value="Approve Payout" />
            </form>
          </div>
  
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
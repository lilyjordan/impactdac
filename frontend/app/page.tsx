import logo from './logo.svg';
'use client'  // wtf

import React from 'react';
import { ethers } from "ethers";
import DACArtifact from '../artifacts/DAC.sol/DAC.json';
import DACFactoryArtifact from '../artifacts/DAC.sol/DACFactory.json';
import dynamic from 'next/dynamic';
import { CreateDACForm, ContributeForm, ApprovePayoutForm,
  RefundForm, ClaimCompForm, AppState, Network } from './types';

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

export class App extends React.Component<{}, AppState> {
  private provider?: ethers.BrowserProvider;
  private signer?: ethers.Signer;
  private DACFactory?: ethers.Contract;
  private DACFactoryAddress?: string

  private initialState: AppState = {
    selectedAddress: undefined,
    DACs: [],
    txBeingSent: undefined,
    messageDuringTx: undefined,
    transactionError: undefined,
    networkError: undefined,
    formCreateDAC: {
      arbitrator: "",
      deadline: null,
      goal: null,
      contribCompPct: null,
      sponsorCompPct: null,
      title: "",
    },
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
  };

  state = this.initialState;

  constructor(props: {}) {
    super(props);
    this._initializeEthers().then(this._connectWallet);
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
    });
  }

  async _updateContracts() {
    if (!this.DACFactory) {
      return;
    }
    if (!this.provider) {
      return;
    }
    const code = await this.provider.getCode(this.DACFactoryAddress!);
    let contracts = await this.DACFactory.getContracts(this.state.selectedAddress);
    this.setState({DACs: contracts});
  }

  _resetState() {
    this.setState(this.initialState);
  }

  _connectWallet = async () => {
    console.log('connecting wallet')
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(async (addresses: string[]) => {
      this.setState({selectedAddress: addresses[0]});
      console.log(`addr: ${addresses[0]}`)
      const balance = await this.provider!.getBalance(addresses[0]);
      console.log(`balance: ${balance}`);
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
    
    window.ethereum.on("chainChanged", ([chainId]: [string]) => {
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

  // Function to create a new DAC
  createDAC = async (_arbitrator: string, _deadline: number, _goal: number, _contribCompPct: number, _sponsorCompPct: number,
    _title: string) => {
      if (!this.DACFactory) {
        throw new Error('DACFactory is not initialized');
      }
      console.log((_goal * (100 + _contribCompPct) / 100).toString());
      const value = ethers.parseEther((_goal * (100 + _contribCompPct) / 100).toString());
      console.log(`value: ${value}`)
      let transaction = await this.DACFactory.createDAC(_arbitrator, _deadline, _goal, _contribCompPct, _sponsorCompPct, _title, {
          value: value
      });
      let receipt = await transaction.wait();
      let dacAddress = receipt.events[0].args[0]; // get the address of the new DAC
      let dac = new ethers.Contract(dacAddress, DACArtifact.abi, this.signer);
      console.log('created dac:');
      console.log(dac);
      return dac;
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

  handleCreateDACChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({ formCreateDAC: { ...this.state.formCreateDAC, [name]: value } });
  }

  // TODO don't allow submit until everything's filled out and non-null
  handleCreateDACSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await this.createDAC(
        this.state.formCreateDAC.arbitrator,
        this.state.formCreateDAC.deadline,
        this.state.formCreateDAC.goal,
        this.state.formCreateDAC.contribCompPct,
        this.state.formCreateDAC.sponsorCompPct,
        this.state.formCreateDAC.title
      );
    } catch (error) {
      console.error(error);
    }
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
    return (
      <div>
          <div className="m-4">
            <h1>DACFactoryAddress: {this.DACFactoryAddress}</h1>
            <h1>Create DAC</h1>
            <form id="createDACForm" onSubmit={this.handleCreateDACSubmit}>
                <label htmlFor="arbitrator">Arbitrator:</label><br />
                <input type="text" id="arbitrator" name="arbitrator" onChange={this.handleCreateDACChange}/><br />
                <label htmlFor="deadline">Deadline:</label><br />
                <input type="number" id="deadline" name="deadline" onChange={this.handleCreateDACChange}/><br />
                <label htmlFor="goal">Goal:</label><br />
                <input type="number" id="goal" name="goal" onChange={this.handleCreateDACChange}/><br />
                <label htmlFor="contribCompPct">Contributor Compensation Percent:</label><br />
                <input type="number" id="contribCompPct" name="contribCompPct" onChange={this.handleCreateDACChange}/><br />
                <label htmlFor="sponsorCompPct">Sponsor Compensation Percent:</label><br />
                <input type="number" id="sponsorCompPct" name="sponsorCompPct" onChange={this.handleCreateDACChange}/><br />
                <label htmlFor="title">Title:</label><br />
                <input type="text" id="title" name="title" onChange={this.handleCreateDACChange}/><br />
                <input className="text-green-500" type="submit" value="Create" />
            </form>
          </div>
  
          <div className="m-4">
            <h1>Contribute to DAC</h1>
            <form id="contributeForm">
                <label htmlFor="dacAddress">DAC Address:</label><br />
                <input type="text" id="dacAddress" name="dacAddress" /><br />
                <label htmlFor="amount">Amount:</label><br />
                <input type="text" id="amount" name="amount" /><br />
                <input className="text-green-500" type="submit" value="Contribute" />
            </form>
          </div>
  
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

const NoSSRApp = dynamic(() => Promise.resolve(App), { ssr: false });

function Page() {
  return <NoSSRApp />;
}

export default Page;
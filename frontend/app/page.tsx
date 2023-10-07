import logo from './logo.svg';
'use client'  // wtf

import React from 'react';
import { ethers } from "ethers";
import DACArtifact from '../artifacts/DAC.sol/DAC.json';
import DACFactoryArtifact from '../artifacts/DAC.sol/DACFactory.json';
import dynamic from 'next/dynamic';
import { DACProperties, RequiredDACProperties, ContributeForm,
  ApprovePayoutForm, RefundForm, ClaimCompForm, AppState,
  Network } from './types';
import { Contract } from './contract';

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
      // arbitrator: undefined,
      // deadline: undefined,
      // goal: undefined,
      // contribCompPct: undefined,
      // sponsorCompPct: undefined,
      // title: undefined,
      arbitrator: '0xE57bFE9F44b819898F47BF37E5AF72a0783e1141',
      deadline: 1687669795,
      goal: 10,
      contribCompPct: 5,
      sponsorCompPct: 10,
      title: undefined,
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
    let contracts = await this.DACFactory.getContracts();
    this.setState({DACs: contracts});
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

  // Function to create a new DAC
  createDAC = async (form : RequiredDACProperties) => {
      if (!this.DACFactory) {
        throw new Error('DACFactory is not initialized');
      }
      const val = ethers.parseEther((form.goal * form.contribCompPct / 100).toString());
      let transaction = await this.DACFactory.createDAC(
          form.arbitrator,
          form.deadline,
          ethers.parseEther(form.goal.toString()),
          form.contribCompPct,
          form.sponsorCompPct,
          form.title,
          {value: val}
      );
      let receipt = await transaction.wait();

      const nonce = await this.provider!.getTransactionCount(this.DACFactoryAddress!, 'latest');
      const dacAddress = ethers.getCreateAddress({ from: this.DACFactoryAddress!, nonce: nonce });
      let dac = new ethers.Contract(dacAddress, DACArtifact.abi, this.signer);
      this._updateContracts();
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
    const name = event.target.name as keyof DACProperties;
    let value: string | number | null = event.target.value;
  
    if (typeof this.state.formCreateDAC[name] === 'number' || this.state.formCreateDAC[name] === null) {
      value = Number(value);
    }

    this.setState({ formCreateDAC: { ...this.state.formCreateDAC, [name]: value } });

  }

  isFormValid = (form: DACProperties): form is RequiredDACProperties => {
    return !Object.values(form).some(value => value === undefined);
  };

  parseDACProperties = (form: RequiredDACProperties): RequiredDACProperties => {
    return {
      arbitrator: form.arbitrator,
      deadline: Number(form.deadline),
      goal: Number(form.goal),
      contribCompPct: Number(form.contribCompPct),
      sponsorCompPct: Number(form.sponsorCompPct),
      title: form.title
    };
  };
  
  handleCreateDACSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (this.isFormValid(this.state.formCreateDAC)) {
        const parsedForm = this.parseDACProperties(this.state.formCreateDAC);
        await this.createDAC(parsedForm);
      } else {
        alert('fill out all fields');
      }
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
    const dacs = this.state.DACs.map(
      (address, index) => <Contract address={address} signer={this.signer!}></Contract>
    );

    return (
      <div>
          <div className="m-4">
            <h1>DACFactoryAddress: {this.DACFactoryAddress}</h1>
            <div className="flex flex-wrap w-[80%] bg-goldenrod-darker">
              {dacs}
            </div>
            <h1>Create DAC</h1>
            <form id="DACProperties" onSubmit={this.handleCreateDACSubmit}>
                <label htmlFor="arbitrator">Arbitrator:</label><br />
                <input type="text" id="arbitrator" value={this.state.formCreateDAC.arbitrator} name="arbitrator" onChange={this.handleCreateDACChange}/><br />
                <label htmlFor="deadline">Deadline:</label><br />
                <input type="number" id="deadline" value={this.state.formCreateDAC.deadline} name="deadline" onChange={this.handleCreateDACChange}/><br />
                <label htmlFor="goal">Goal:</label><br />
                <input type="number" id="goal" value={this.state.formCreateDAC.goal} name="goal" onChange={this.handleCreateDACChange}/><br />
                <label htmlFor="contribCompPct">Contributor Compensation Percent:</label><br />
                <input type="number" id="contribCompPct" value={this.state.formCreateDAC.contribCompPct} name="contribCompPct" onChange={this.handleCreateDACChange}/><br />
                <label htmlFor="sponsorCompPct">Sponsor Compensation Percent:</label><br />
                <input type="number" id="sponsorCompPct" value={this.state.formCreateDAC.sponsorCompPct} name="sponsorCompPct" onChange={this.handleCreateDACChange}/><br />
                <label htmlFor="title">Title:</label><br />
                <input type="text" id="title" value={this.state.formCreateDAC.title} name="title" onChange={this.handleCreateDACChange}/><br />
                <input className="text-green-500" type="submit" value="Create" />
            </form>
          </div>
  
          <div className="m-4">
            <h1>Pledge</h1>
            <form id="contributeForm">
                <label htmlFor="dacAddress">DAC Address:</label><br />
                <input type="text" id="dacAddress" name="dacAddress" /><br />
                <label htmlFor="amount">Amount:</label><br />
                <input type="text" id="amount" name="amount" /><br />
                <input className="text-green-500" type="submit" value="Pledge" />
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
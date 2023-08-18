import logo from './logo.svg';
'use client'  // wtf

import React from 'react';
import { ethers } from "ethers";
import DACArtifact from '../artifacts/DAC.sol/DAC.json';
import DACFactoryArtifact from '../artifacts/DAC.sol/DACFactory.json';
import dynamic from 'next/dynamic';
import { Passero_One } from 'next/font/google';


let DACFactoryAddress: string;

fetch("/run-latest.json")
.then(response => response.json())
.then(json => {DACFactoryAddress = json.transactions[0].contractAddress});

declare global {
  interface Window {
    ethereum: any;
  }
}

type CreateDACForm = {
  arbitrator: string;
  deadline: number;
  goal: number;
  contribCompPct: number;
  sponsorCompPct: number;
  title: string;
};

type ContributeForm = {
  dacAddress: string;
  amount: string;
};

type ApprovePayoutForm = {
  dacAddressPayout: string;
  founder: string;
};

type RefundForm = {
  dacAddressRefund: string;
};

type ClaimCompForm = {
  dacAddressClaim: string;
};

type AppState = {
  formCreateDAC: CreateDACForm;
  formContribute: ContributeForm;
  formApprovePayout: ApprovePayoutForm;
  formRefund: RefundForm;
  formClaimComp: ClaimCompForm;
  selectedAddress?: string;
  DACs: any[];
  txBeingSent?: string;
  messageDuringTx?: string;
  transactionError?: string;
  networkError?: string;
}

export class App extends React.Component<{}, AppState> {
  private provider?: ethers.BrowserProvider;
  private signer?: ethers.Signer;
  private DACFactory?: ethers.Contract;

  state = {
    selectedAddress: undefined,
    DACs: [],
    txBeingSent: undefined,
    messageDuringTx: undefined,
    transactionError: undefined,
    networkError: undefined,
    formCreateDAC: {
      arbitrator: "",
      deadline: 0,
      goal: 0,
      contribCompPct: 0,
      sponsorCompPct: 0,
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


  async _initializeEthers() {
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.DACFactory = new ethers.Contract(
      DACFactoryAddress,
      DACFactoryArtifact.abi,
      this.signer
    );
    await this.DACFactory.deployed();
  }

  async _updateContracts() {
    if (!this.DACFactory) {
      return;
    }
    const code = await this.provider.getCode(DACFactoryAddress);
    let holdings = await this.DACFactory.getHoldings(this.state.selectedAddress);
    holdings = holdings.map(w => ethers.encodeBytes32String(w));
    this.setState({markets: holdings});
  }

  // Function to create a new DAC
  createDAC = async (_arbitrator: string, _deadline: number, _goal: number, _contribCompPct: number, _sponsorCompPct: number,
    _title: string) => {
      console.log('called');
      if (!this.DACFactory) {
        throw new Error('DACFactory is not initialized');
      }
      let transaction = await this.DACFactory.createDAC(_arbitrator, _deadline, _goal, _contribCompPct, _sponsorCompPct, _title, {
          value: ethers.parseEther((_goal * (100 + _contribCompPct) / 100).toString())
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

  handleCreateDACChange(event: React.ChangeEvent<HTMLInputElement>) {
    const name = event.target.name;
    const value = event.target.value;
    this.setState({ formCreateDAC: { ...this.state.formCreateDAC, [name]: value } });
  }

  handleCreateDACSubmit= (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.createDAC(this.state.formCreateDAC.arbitrator,
      this.state.formCreateDAC.deadline,
      this.state.formCreateDAC.goal,
      this.state.formCreateDAC.contribCompPct,
      this.state.formCreateDAC.sponsorCompPct,
      this.state.formCreateDAC.title
      )
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

  

  // handleChange = (e: React.ChangeEvent<HTMLInputElement>, formName: keyof AppState) => {
  //   const { name, value } = e.target;
  //   this.setState((prevState) => {
  //     const formState = prevState[formName];
  //     return {
  //       ...prevState,
  //       [formName]: {
  //         ...formState,
  //         [name]: value
  //       }
  //     };
  //   });
  // };


  render() {
    return (
      <div>
          <div className="m-4">
            <h1>DACFactoryAddress: {DACFactoryAddress}</h1>
            <h1>Create DAC</h1>
            <form id="createDACForm" onSubmit={this.handleCreateDACSubmit}>
                <label htmlFor="arbitrator">Arbitrator:</label><br />
                <input type="text" id="arbitrator" name="arbitrator"/><br />
                <label htmlFor="deadline">Deadline:</label><br />
                <input type="text" id="deadline" name="deadline" /><br />
                <label htmlFor="goal">Goal:</label><br />
                <input type="text" id="goal" name="goal" /><br />
                <label htmlFor="contribCompPct">Contributor Compensation Percent:</label><br />
                <input type="text" id="contribCompPct" name="contribCompPct" /><br />
                <label htmlFor="sponsorCompPct">Sponsor Compensation Percent:</label><br />
                <input type="text" id="sponsorCompPct" name="sponsorCompPct" /><br />
                <label htmlFor="title">Title:</label><br />
                <input type="text" id="title" name="title" /><br />
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
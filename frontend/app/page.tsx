import logo from './logo.svg';
'use client'  // wtf

import React from 'react';
import { ethers } from "ethers";
import DACArtifact from '../artifacts/DAC.sol/DAC.json';
import DACFactoryArtifact from '../artifacts/DAC.sol/DACFactory.json';
import dynamic from 'next/dynamic';

let DACFactoryAddress = 'YOUR_DAC_FACTORY_CONTRACT_ADDRESS'; // replace with your contract address

declare global {
  interface Window {
    ethereum: any;
  }
}

export class App extends React.Component {
  private signer?: ethers.Signer;
  private DACFactory?: ethers.Contract;

  async _initializeEthers() {
    let provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await provider.getSigner();
    this.DACFactory = new ethers.Contract(
      DACFactoryAddress,
      DACFactoryArtifact.abi,
      this.signer
    );
    await this.DACFactory.deployed();
  }

  // Function to create a new DAC
  async createDAC(_arbitrator: string, _deadline: number, _goal: number, _contribCompPct: number, _sponsorCompPct: number) {
      let transaction = await this.DACFactory.createDAC(_arbitrator, _deadline, _goal, _contribCompPct, _sponsorCompPct, {
          value: ethers.parseEther((_goal * (100 + _contribCompPct) / 100).toString())
      });
      let receipt = await transaction.wait();
      let dacAddress = receipt.events[0].args[0]; // get the address of the new DAC
      let dac = new ethers.Contract(dacAddress, DACArtifact.abi, this.signer);
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

  render() {
    return (
      <div>
          <h1>Create DAC</h1>
          <form id="createDACForm">
              <label htmlFor="arbitrator">Arbitrator:</label><br />
              <input type="text" id="arbitrator" name="arbitrator" /><br />
              <label htmlFor="deadline">Deadline:</label><br />
              <input type="text" id="deadline" name="deadline" /><br />
              <label htmlFor="goal">Goal:</label><br />
              <input type="text" id="goal" name="goal" /><br />
              <label htmlFor="contribCompPct">Contributor Compensation Percent:</label><br />
              <input type="text" id="contribCompPct" name="contribCompPct" /><br />
              <label htmlFor="sponsorCompPct">Sponsor Compensation Percent:</label><br />
              <input type="text" id="sponsorCompPct" name="sponsorCompPct" /><br />
              <input type="submit" value="Create" />
          </form>
  
          <h1>Contribute to DAC</h1>
          <form id="contributeForm">
              <label htmlFor="dacAddress">DAC Address:</label><br />
              <input type="text" id="dacAddress" name="dacAddress" /><br />
              <label htmlFor="amount">Amount:</label><br />
              <input type="text" id="amount" name="amount" /><br />
              <input type="submit" value="Contribute" />
          </form>
  
          <h1>Approve Payout</h1>
          <form id="approvePayoutForm">
              <label htmlFor="dacAddressPayout">DAC Address:</label><br />
              <input type="text" id="dacAddressPayout" name="dacAddressPayout" /><br />
              <label htmlFor="founder">Founder:</label><br />
              <input type="text" id="founder" name="founder" /><br />
              <input type="submit" value="Approve Payout" />
          </form>
  
          <h1>Refund</h1>
          <form id="refundForm">
              <label htmlFor="dacAddressRefund">DAC Address:</label><br />
              <input type="text" id="dacAddressRefund" name="dacAddressRefund" /><br />
              <input type="submit" value="Refund" />
          </form>
  
          <h1>Claim Unowed Contribution Compensation</h1>
          <form id="claimCompForm">
              <label htmlFor="dacAddressClaim">DAC Address:</label><br />
              <input type="text" id="dacAddressClaim" name="dacAddressClaim" /><br />
              <input type="submit" value="Claim Compensation" />
          </form>
      </div>
    );
  }
}

const NoSSRApp = dynamic(() => Promise.resolve(App), { ssr: false });

function Page() {
  return <NoSSRApp />;
}

export default Page;
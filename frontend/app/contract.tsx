import React from 'react';
import { ethers } from "ethers";
import { ContractState } from './types';
import DACArtifact from '../artifacts/DAC.sol/DAC.json';
import Enums from '../public/enum_definitions.json';


export class Contract extends React.Component<
  {address: string; signer: ethers.Signer},
  ContractState
> {

  private initialState: ContractState = {
    arbitrator: undefined,
    deadline: undefined,
    goal: undefined,
    contribCompPct: undefined,
    sponsorCompPct: undefined,
    title: undefined,
    sponsor: undefined,
    fundingState: undefined,
    amountPledged: undefined
  };

  state = this.initialState;

  async componentDidMount() {
    const contract = new ethers.Contract(
      this.props.address,
      DACArtifact.abi,
      this.props.signer
    );

    const sponsor = await contract.sponsor();
    const arbitrator = await contract.arbitrator();
    const deadline = await contract.deadline();
    const goal = await contract.goal();
    const contribCompPct = await contract.contribCompPct();
    const sponsorCompPct = await contract.sponsorCompPct();
    const title = await contract.title();
    const fundingState = await contract.state();
    const amountPledged = await contract.totalContributions();
    console.log('amountPledged:', amountPledged);

    this.setState({
      sponsor,
      arbitrator,
      deadline,
      goal,
      contribCompPct,
      sponsorCompPct,
      title,
      fundingState,
      amountPledged
    });
  }

  render() {
    const { arbitrator, deadline, goal, contribCompPct,
      sponsorCompPct, title, sponsor, fundingState, amountPledged } = this.state;

    return (
      <div className="bg-goldenrod-lighter m-8 p-4 rounded-lg text-black max-w-sm h-64">
        <h2 className="text-4xl font-bold">{title}</h2>
        <div>
          Sponsor <span className="font-bold">{sponsor}</span>
        </div>
        <div>
          <span className="font-bold">{amountPledged?.toString()}</span> of <span
            className="font-bold">{goal ? ethers.formatEther(goal) : '?'} ETH</span> by <span
            className="font-bold">{deadline ? new Date(Number(deadline) * 1000).toLocaleDateString() : '?'}</span>
        </div>
        <div>
          Refund bonus <span className="font-bold">{contribCompPct?.toString()}</span>
        </div>
        <div>
          Sponsor fee: <span className="font-bold">{sponsorCompPct?.toString()}</span>
        </div>
        <div>
          Pledge
        </div>
      </div>
    )
  }
}
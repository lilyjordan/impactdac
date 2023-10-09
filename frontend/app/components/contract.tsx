import React from 'react';
import { ethers } from "ethers";
import { ContractState } from '../types';
import DACArtifact from '../../artifacts/DAC.sol/DAC.json';
import Enums from '../../public/enum_definitions.json';


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
        <div className="bg-goldenrod-lighter m-8 p-8 rounded-lg text-black max-w-sm h-72 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex-none h-18 mb-3">
              <h2 className="text-3xl font-bold">{title}</h2>
            </div>
            <div className="multiline-truncate">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <div style={{ maxWidth: '70%' }}>
              <div className="truncate">
                <span className="font-bold truncate">
                  {amountPledged?.toString()}
                </span>
                {' of '}
                <span className="font-bold truncate">
                  {goal ? ethers.formatEther(goal) : '?'}
                </span>
                {' ETH by '}
                <span className="font-bold truncate">
                  {deadline ? new Date(Number(deadline) * 1000).toLocaleDateString() : '?'}
                </span>
              </div>
              <div className="truncate">
                Sponsor <span className="font-bold truncate">{sponsor}</span>
              </div>
            </div>
            <div className="self-end mt-auto ">
              <button className="bg-goldenrod-darker hover:bg-goldenrod-darkest text-goldenrod-lightest font-bold py-2 px-4 rounded">
                Pledge
              </button>
            </div>
          </div>
        </div>
      )
  }
}
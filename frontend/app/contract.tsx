import React from 'react';
import { ethers } from "ethers";
import { DACProperties } from './types';
import DACArtifact from '../artifacts/DAC.sol/DAC.json';
import Enums from '../public/enum_definitions.json';


export class Contract extends React.Component<
  {address: string; signer: ethers.Signer},
  DACProperties & {sponsor?: string} & {fundingState?: string}
> {

  private initialState: DACProperties & {sponsor?: string} & {fundingState?: string} = {
    arbitrator: undefined,
    deadline: undefined,
    goal: undefined,
    contribCompPct: undefined,
    sponsorCompPct: undefined,
    title: undefined,
    sponsor: undefined,
    fundingState: undefined
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
    console.log('deadline:', deadline);

    this.setState({
      sponsor,
      arbitrator,
      deadline,
      goal,
      contribCompPct,
      sponsorCompPct,
      title,
      fundingState
    });
  }

  render() {
    const { arbitrator, deadline, goal, contribCompPct,
      sponsorCompPct, title, sponsor, fundingState } = this.state;

    return (
      <div className="bg-goldenrod-lighter m-8 p-4 rounded-lg text-black max-w-md h-64">
        <h2 className="text-4xl font-bold">{title}</h2>
        <div>
          address: {this.props.address}
        </div>
        <div>
          sponsor: {sponsor}
        </div>
        <div>
          arbitrator: {arbitrator}
        </div>
        <div>
          deadline: {deadline?.toString()}
        </div>
        <div>
          goal: {goal?.toString()}
        </div>
        <div>
          refund bonus: {contribCompPct?.toString()}
        </div>
        <div>
          sponsor fee: {sponsorCompPct?.toString()}
        </div>
        state: {fundingState !== undefined ? Enums.State[Number(fundingState) as unknown as keyof typeof Enums.State].toString() : ''}
        <div>
          Pledge
        </div>
      </div>
    )
  }
}
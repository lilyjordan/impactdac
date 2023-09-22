import React from 'react';
import { ethers } from "ethers";
import { DACProperties } from './types';
import DACArtifact from '../artifacts/DAC.sol/DAC.json';


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
      <div>
        <h1>{title}</h1>
        address: {this.props.address}
        sponsor: {sponsor}
        arbitrator: {arbitrator}
        deadline: {deadline}
        goal: {goal}
        contribCompPct: {contribCompPct}
        sponsorCompPct: {sponsorCompPct}
        state: {fundingState}
      </div>
    )
  }
}
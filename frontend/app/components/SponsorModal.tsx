import React from 'react';
import { ethers } from "ethers";
import { DACProperties, RequiredDACProperties } from '../types'
import DACArtifact from '../../artifacts/DAC.sol/DAC.json';


interface SponsorModalProps {
  DACFactory?: ethers.Contract,
  DACFactoryAddress?: string,
  provider?: ethers.BrowserProvider,
  signer?: ethers.Signer,
  onDACCreated: () => void,
  onClickX: () => void
}


export class SponsorModal extends React.Component<
  SponsorModalProps, {}
> {
  private initialState: DACProperties = {
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
  };

  state = this.initialState;


  handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name as keyof DACProperties;
    let value: string | number | null = event.target.value;
  
    if (typeof this.state[name] === 'number' || this.state[name] === null) {
      value = Number(value);
    }

    this.setState({ ...this.state, [name]: value });
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

    
  handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (this.isFormValid(this.state)) {
        const parsedForm = this.parseDACProperties(this.state);
        await this.createDAC(parsedForm);
      } else {
        alert('Missing fields');
      }
    } catch (error) {
      console.error(error);
    }
  }


  createDAC = async (form : RequiredDACProperties) => {
    if (!this.props.DACFactory) {
      throw new Error('DACFactory is not initialized');
    }
    const val = ethers.parseEther((form.goal * form.contribCompPct / 100).toString());
    let transaction = await this.props.DACFactory.createDAC(
        form.arbitrator,
        form.deadline,
        ethers.parseEther(form.goal.toString()),
        form.contribCompPct,
        form.sponsorCompPct,
        form.title,
        {value: val}
    );
    let receipt = await transaction.wait();

    // This extra nonce stuff is in here to check what address the contract got created to
    // However I'm not sure we need it anymore, since now the factory contract keeps
    // track of all the DAC contracts it's deployed
    const nonce = await this.props.provider!.getTransactionCount(this.props.DACFactoryAddress!, 'latest');
    const dacAddress = ethers.getCreateAddress({ from: this.props.DACFactoryAddress!, nonce: nonce });
    let dac = new ethers.Contract(dacAddress, DACArtifact.abi, this.props.signer);
    this.props.onDACCreated();
    // // return dac;
    // return 1;
  }


  render() {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="relative bg-white rounded-lg p-8">
          <button className="absolute top-2 left-2 text-gray-500 font-bold"
            onClick={this.props.onClickX}
          >
            X
          </button>
          <div className='m-4'>
            <h1>Sponsor a bounty</h1>
            <form id="DACProperties" onSubmit={this.handleSubmit}>
              <label htmlFor="arbitrator">Arbitrator:</label><br />
              <input type="text" id="arbitrator" value={this.state.arbitrator} name="arbitrator" onChange={this.handleChange}/><br />
              <label htmlFor="deadline">Deadline:</label><br />
              <input type="number" id="deadline" value={this.state.deadline} name="deadline" onChange={this.handleChange}/><br />
              <label htmlFor="goal">Goal:</label><br />
              <input type="number" id="goal" value={this.state.goal} name="goal" onChange={this.handleChange}/><br />
              <label htmlFor="contribCompPct">Contributor Compensation Percent:</label><br />
              <input type="number" id="contribCompPct" value={this.state.contribCompPct} name="contribCompPct" onChange={this.handleChange}/><br />
              <label htmlFor="sponsorCompPct">Sponsor Compensation Percent:</label><br />
              <input type="number" id="sponsorCompPct" value={this.state.sponsorCompPct} name="sponsorCompPct" onChange={this.handleChange}/><br />
              <label htmlFor="title">Title:</label><br />
              <input type="text" id="title" value={this.state.title} name="title" onChange={this.handleChange}/><br />
              <input className="text-green-500" type="submit" value="Create" />
            </form>
          </div>
        </div>
      </div>
    )
  }
}

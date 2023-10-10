import React from 'react';
import { ethers } from "ethers";
import { ContractData } from '../types';


export class ContractModal extends React.Component<
  {
    contractData: ContractData,
    signer: ethers.Signer,
    onPledgeAdded: () => void,
    onClickX: () => void
  }
> {

  handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // const name = event.target.name as keyof DACProperties;
    // let value: string | number | null = event.target.value;
  
    // if (typeof this.state[name] === 'number' || this.state[name] === null) {
    //   value = Number(value);
    // }

    // this.setState({ ...this.state, [name]: value });
  }


  // isFormValid = (form: DACProperties): form is RequiredDACProperties => {
    // return !Object.values(form).some(value => value === undefined);
  // };


  // handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // event.preventDefault();
    // try {
    //   if (this.isFormValid(this.state)) {
    //     const parsedForm = this.parseDACProperties(this.state);
    //     await this.createDAC(parsedForm);
    //   } else {
    //     alert('Missing fields');
    //   }
    // } catch (error) {
    //   console.error(error);
    // }
  // }


  render() {
    const { contractData, onClickX } = this.props;

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
              <input type="text" id="arbitrator" value={contractData.arbitrator} name="arbitrator" onChange={this.handleChange}/><br />
              <label htmlFor="deadline">Deadline:</label><br />
              <input type="number" id="deadline" value={contractData.deadline} name="deadline" onChange={this.handleChange}/><br />
              <label htmlFor="goal">Goal:</label><br />
              <input type="number" id="goal" value={contractData.goal} name="goal" onChange={this.handleChange}/><br />
              <label htmlFor="contribCompPct">Contributor Compensation Percent:</label><br />
              <input type="number" id="contribCompPct" value={contractData.contribCompPct} name="contribCompPct" onChange={this.handleChange}/><br />
              <label htmlFor="sponsorCompPct">Sponsor Compensation Percent:</label><br />
              <input type="number" id="sponsorCompPct" value={contractData.sponsorCompPct} name="sponsorCompPct" onChange={this.handleChange}/><br />
              <label htmlFor="title">Title:</label><br />
              <input type="text" id="title" value={contractData.title} name="title" onChange={this.handleChange}/><br />
              <input className="text-green-500" type="submit" value="Create" />
            </form>
          </div>
        </div>
      </div>
    )
  }
}

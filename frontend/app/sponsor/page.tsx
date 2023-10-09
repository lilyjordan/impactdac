'use client'
import React from 'react';
import DACFactoryArtifact from '../../artifacts/DAC.sol/DACFactory.json';


export default class SponsorPage extends React.Component<{}, {}> {
  handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    
  handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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


  render() {
    return (
      <div>
        <h1>Sponsor a bounty</h1>
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
    )
  }
}

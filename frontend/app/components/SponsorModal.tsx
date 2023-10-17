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
  onClose: () => void
}


export class SponsorModal extends React.Component<
  SponsorModalProps, {}
> {
  private initialState: DACProperties & {waiting: boolean} = {
      // arbitrator: undefined,
      // deadline: undefined,
      // goal: undefined,
      // contribCompPct: undefined,
      // sponsorCompPct: undefined,
      // title: undefined,
      arbitrator: '0xE57bFE9F44b819898F47BF37E5AF72a0783e1141',
      deadline: BigInt(1698669795),
      goal: BigInt(1),
      contribCompPct: BigInt(5),
      sponsorCompPct: BigInt(10),
      title: undefined,
      description: undefined,
      waiting: false
  };

  state = this.initialState;


  handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name as keyof DACProperties;
    let value: string | bigint | null = event.target.value;

    const bigIntFields = ['deadline', 'goal', 'contribCompPct', 'sponsorCompPct'];
    if (bigIntFields.includes(name)) {
      value = BigInt(value);
    }

    this.setState({ ...this.state, [name]: value });
  }


  isFormValid = (form: DACProperties): form is RequiredDACProperties => {
    return !Object.values(form).some(value => value === undefined);
  };


  parseDACProperties = (form: RequiredDACProperties): RequiredDACProperties => {
    return {
      arbitrator: form.arbitrator,
      deadline: BigInt(form.deadline),
      goal: BigInt(form.goal),
      contribCompPct: BigInt(form.contribCompPct),
      sponsorCompPct: BigInt(form.sponsorCompPct),
      title: form.title,
      description: form.description
    };
  };


  handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (this.isFormValid(this.state)) {
        const parsedForm = this.parseDACProperties(this.state);
        await this.createContract(parsedForm);
      } else {
        alert('Missing fields');
      }
    } catch (error) {
      console.error(error);
    }
  }


  createContract = async (form : RequiredDACProperties) => {
    if (!this.props.DACFactory) {
      throw new Error('DACFactory is not initialized');
    }
    const val = ethers.parseEther(form.goal.toString()) * form.contribCompPct / BigInt(100);
    let transaction = await this.props.DACFactory.createDAC(
        form.arbitrator,
        form.deadline,
        ethers.parseEther(form.goal.toString()),
        form.contribCompPct,
        form.sponsorCompPct,
        form.title,
        {value: val}
    );
    this.setState({waiting: true});

    let receipt = await transaction.wait();

    // This extra nonce stuff is in here to check what address the contract got created to
    // However I'm not sure we need it anymore, since now the factory contract keeps
    // track of all the DAC contracts it's deployed
    const nonce = await this.props.provider!.getTransactionCount(this.props.DACFactoryAddress!, 'latest');
    const dacAddress = ethers.getCreateAddress({ from: this.props.DACFactoryAddress!, nonce: nonce });
    let dac = new ethers.Contract(dacAddress, DACArtifact.abi, this.props.signer);

    // fetch('/api/insertContract', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     id: 1,
    //     address: dacAddress,
    //     description: this.state.description
    //   })
    // })
    // .then(response => response.json())
    // .then(data => {
    //   // Handle success or failure
    // });

    this.props.onDACCreated();
    this.setState({waiting: false});
  }


  testPost() {
    fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: '0xE57bFE9F44b819898F47BF37E5AF72a0783e1142',
        description: 'another test description'
      })
    })
    .then(response => response.json())
    .then(data => {
      // Handle success or failure
      console.log('result:', data);
    });
  }


  render() {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50 \\
          bg-black bg-opacity-50 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              this.props.onClose();
            }
          }}
      >
        <div
          className="relative rounded-lg p-8 bg-goldenrod-lighter shadow-lg \
            cursor-auto"
        >
          <div className='m-4'>
            <button onClick={this.testPost}>Test post</button>
            <h1>Sponsor a bounty</h1>
            <form id="DACProperties" onSubmit={this.handleSubmit}>
            <label htmlFor="deadline">Deadline:</label><br />
            <label htmlFor="arbitrator">Arbitrator:</label><br />
              <input
                type="text"
                id="arbitrator"
                value={this.state.arbitrator}
                name="arbitrator"
                onChange={this.handleChange}
                />
              <br />
              <input
                type="number"
                id="deadline"
                // TODO I think the real problem is with the underlying types,
                // probably DACProperties should be renamed to something that
                // makes it more explicitly a form input and everything on it
                // should be a string? idk?
                value={this.state.deadline ? this.state.deadline.toString() : ''} 
                name="deadline"
                onChange={this.handleChange}
                />
              <br />
              <label htmlFor="goal">Goal:</label><br />
              <input
                type="number"
                id="goal"
                value={this.state.goal ? this.state.goal.toString() : ''} 
                name="goal"
                onChange={this.handleChange}
                />
              <br />
              <label htmlFor="contribCompPct">Contributor Compensation Percent:</label><br />
              <input
                type="number"
                id="contribCompPct"
                value={this.state.contribCompPct ? this.state.contribCompPct.toString() : ''} 
                name="contribCompPct"
                onChange={this.handleChange}
                />
              <br />
              <label htmlFor="sponsorCompPct">Sponsor Compensation Percent:</label><br />
              <input
                type="number"
                id="sponsorCompPct"
                value={this.state.contribCompPct ? this.state.contribCompPct.toString() : ''} 
                name="sponsorCompPct"
                onChange={this.handleChange}
                />
              <br />
              <label htmlFor="title">Title:</label><br />
              <input
                type="text"
                id="title"
                value={this.state.title}
                name="title"
                onChange={this.handleChange}
              />
              <br />
              <label htmlFor="description">Description:</label><br />
              <input
                type="text"
                id="description"
                value={this.state.description}
                name="description"
                onChange={this.handleChange}
              />
              <br />
              {this.state.waiting ?
                <div className="mt-4">Waiting for transaction...</div> :
                <input
                  className="bg-goldenrod-darker hover:bg-goldenrod-darkest \
                    text-goldenrod-lightest font-bold py-2 px-4 rounded mt-4 \
                    cursor-pointer"
                  type="submit"
                  value="Create"
                />
              }
            </form>
          </div>
        </div>
      </div>
    )
  }
}

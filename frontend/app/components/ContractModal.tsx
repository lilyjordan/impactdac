import React from 'react';
import { ethers } from "ethers";
import { ContractData } from '../types';


export class ContractModal extends React.Component<
  {
    contractData: ContractData,
    signer: ethers.Signer,
    onPledgeAdded: () => void,
    onClose: () => void
  }
> {

  state = {
    pledgeAmount: 0.01
  };

  handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const valueStr: string = event.target.value;
    const value = Number(valueStr);
    this.setState({pledgeAmount: value});
  }


  addPledge = async () => {
    const { contractData } = this.props;
    let val;
    try {
      val = ethers.parseEther(this.state.pledgeAmount.toString());
      let transaction = await contractData.contract.contribute(
        {value: val}
      );
      let receipt = await transaction.wait();
      this.props.onPledgeAdded();
    } catch (error) {
      console.error(error);
    }
  }


  render() {
    const { contractData, onClose } = this.props;

    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50 \
          bg-black bg-opacity-50 cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            this.props.onClose();
          }
        }}
      >
        <div
            className="relative bg-goldenrod-lighter m-8 p-8 rounded-lg text-black \
              max-w-md shadow-lg flex flex-col justify-between cursor-auto"
        >
          <div>
            <div className="flex-none h-18 mb-3">
              <h2 className="text-3xl font-bold">{contractData.title}</h2>
            </div>
            <div className="mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </div>
          </div>
          <div className="text-sm">
            <div className="mb-4">
              <div className="truncate">
                <span className="font-bold truncate">
                  {contractData.amountPledged?.toString()}
                </span>
                {' of '}
                <span className="font-bold truncate">
                  {contractData.goal ? ethers.formatEther(contractData.goal) : '?'}
                </span>
                {' ETH by '}
                <span className="font-bold truncate">
                  {contractData.deadline ? new Date(Number(contractData.deadline) * 1000).toLocaleDateString() : '?'}
                </span>
              </div>
              <div className="truncate">
                Sponsor <span className="font-bold truncate">{contractData.sponsor}</span>
              </div>
            </div>
            <div className="self-end mt-auto flex items-center justify-center">
              <div className="mr-4">
                <input 
                  type="number"
                  value={this.state.pledgeAmount}
                  onChange={this.handleChange}
                  className="border rounded py-1 px-2 mr-2 w-24"
                />
                <span>
                  ETH
                </span>
              </div>
              <button
                className="bg-goldenrod-darker hover:bg-goldenrod-darkest \
                  text-goldenrod-lightest font-bold py-2 px-4 rounded ml-2"
                onClick={this.addPledge}
              >
                Pledge
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

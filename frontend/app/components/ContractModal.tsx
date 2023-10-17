import React from 'react';
import { ethers } from "ethers";
import { ContractData } from '../types';
import { goalPlusSponsorComp, userIsArbitrator } from '../utils';


export class ContractModal extends React.Component<
  {
    contractData: ContractData,
    userAddress: string | undefined,
    signer: ethers.Signer,
    onPledgeAdded: (addr: string) => void,
    onClose: () => void
  }> {


  state = {
    pledgeAmount: '0.01',
    grantee: undefined,
    inputFocused: false
  };


  handleBlur = () => {
    this.setState({ inputFocused: false });
    if (this.state.pledgeAmount == '') {
      this.setState({pledgeAmount: 0.01});
    }
  };


  handlePledgeAmountChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!/^(0|[1-9]\d*)?(\.\d*)?$/.test(event.target.value)) {
      return;
    }
    this.setState({ pledgeAmount: event.target.value });
  };


  addPledge = async () => {
    // TODO check whether userAddress is present
    const { contractData } = this.props;
    let val;
    // TODO don't allow pledge higher than the amount remaining. We probably
    // want to call the contract directly again here to be sure
    try {
      val = ethers.parseEther(this.state.pledgeAmount);
      let transaction = await contractData.contract.contribute(
        {value: val}
      );
      let receipt = await transaction.wait();
      this.props.onPledgeAdded(this.props.contractData.address);
    } catch (error) {
      console.error(error);
    }
  }


  handleGranteeChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ grantee: event.target.value });
  }


  approvePayout = async () => {
    const { contractData, userAddress } = this.props;
    if (this.state.grantee && userIsArbitrator(contractData, userAddress)) {
      // TODO validate
      contractData.contract.approvePayout(this.state.grantee);
    }
  }


  claimRefund = async () => {
    const { contractData, userAddress } = this.props;
    if (contractData.userContribution > 0) {
      contractData.contract.refund();
    }
  }


  render() {
    const { contractData, onClose, signer, userAddress } = this.props;

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
              {contractData.description}
            </div>
          </div>
          <div className="text-sm">
            <div className="mb-4">
              <div className="truncate">
                <span className="font-bold truncate">
                  {ethers.formatEther(contractData.amountPledged?.toString())}
                </span>
                {' of '}
                <span className="font-bold truncate">
                  {ethers.formatEther(goalPlusSponsorComp(contractData))}
                </span>
                {' ETH by '}
                <span className="font-bold truncate">
                  {new Date(Number(contractData.deadline) * 1000).toLocaleDateString()}
                </span>
              </div>
              <div className="truncate">
                Sponsor <span className="font-bold truncate">{contractData.sponsor}</span>
              </div>
            </div>
            {contractData.fundingState === 'Funding' &&
            <div className="self-end mt-auto flex items-center justify-center">
              <div className="mr-4">
                <input 
                  type="text"
                  value={this.state.pledgeAmount}
                  onChange={this.handlePledgeAmountChange}
                  step="any"
                  onFocus={() => this.setState({ inputFocused: true })}
                  onBlur={this.handleBlur}
                  className="border rounded py-1 px-2 mr-2 w-24"
                  style={{ appearance: 'none' }}
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
            }
            {contractData.fundingState === 'Funded' && userIsArbitrator(contractData, userAddress) &&
              <div className="mr-4">
                <input 
                  type="string"
                  value={this.state.grantee}
                  onChange={this.handleGranteeChange}
                  step="any"
                  onFocus={() => this.setState({ inputFocused: true })}
                  onBlur={this.handleBlur}
                  className="border rounded py-1 px-2 mr-2 w-24"
                  style={{ appearance: 'none' }}
                />
                <button
                  className="bg-goldenrod-darker hover:bg-goldenrod-darkest \
                    text-goldenrod-lightest font-bold py-2 px-4 rounded ml-2"
                  onClick={this.approvePayout}
                >
                  Approve payout
                </button>
              </div>
            }
            {contractData.fundingState === 'Failed' && contractData.userContribution > 0 &&
              <div className="mr-4">
                <button
                  className="bg-goldenrod-darker hover:bg-goldenrod-darkest \
                    text-goldenrod-lightest font-bold py-2 px-4 rounded ml-2"
                  onClick={this.claimRefund}
                >
                  Refund your {ethers.formatEther(
                    contractData.userContribution.toString())} ETH pledge
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    )
  }
}

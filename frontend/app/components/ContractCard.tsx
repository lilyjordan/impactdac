import React from 'react';
import { Contract, ethers } from "ethers";
import { ContractData } from '../types';
import Enums from '../../public/enum_definitions.json';


export class ContractCard extends React.Component<
  {
    contractData: ContractData,
    signer: ethers.Signer,
    openContractModal: (addr: string) => void
  }
> {

  render() {
    const { contractData, openContractModal } = this.props;

    return (
      <div
        className="bg-goldenrod-lighter m-8 p-8 rounded-lg text-black \
          max-w-sm h-72 shadow-lg flex flex-col justify-between"
        onClick={() => openContractModal(contractData.address)}
      >
        <div>
          <div className="flex-none h-18 mb-3">
            <h2 className="text-3xl font-bold">{contractData.title}</h2>
          </div>
          <div className="multiline-truncate">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <div style={{ maxWidth: '70%' }}>
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
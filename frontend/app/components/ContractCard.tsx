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

  goalPlusSponsorComp = this.props.contractData.goal * (BigInt(100) +
    this.props.contractData.sponsorCompPct) / BigInt(100);

  render() {
    const { contractData, openContractModal } = this.props;
    const isExpired = ['Failed', 'Approved'].includes(contractData.fundingState);

    return (
      <div
        className="bg-goldenrod-lighter p-8 rounded-lg text-black \
          max-w-xs h-80 shadow-lg flex flex-col justify-between \
          cursor-pointer text-left relative"
        onClick={() => openContractModal(contractData.address)}
      >
        {isExpired && (
          <div className="absolute inset-0 bg-black opacity-25 z-10 rounded-lg" />
        )}
        <div>
          <div className="flex-none h-18 mb-3">
            <h2 className="text-3xl font-bold">{contractData.title}</h2>
          </div>
          <div className="multiline-truncate">
            {contractData.description}
          </div>
        </div>
        <div className="text-sm">
          <div className="truncate">
            <span className="font-bold truncate">
              {ethers.formatEther(contractData.amountPledged.toString())}
            </span>
            {' of '}
            <span className="font-bold truncate">
              {ethers.formatEther(this.goalPlusSponsorComp)}
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
      </div>
    )
  }
}
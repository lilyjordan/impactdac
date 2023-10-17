import { ContractData } from './types';


export function goalPlusSponsorComp(contract: ContractData) : bigint {
  return contract.goal * (BigInt(100) + contract.sponsorCompPct) /BigInt(100);
}


export function userIsArbitrator(contract: ContractData,
  addr: string | undefined) : boolean {
  if (addr) {
    return contract.arbitrator.toLowerCase() === addr.toLowerCase();
  }
  return false;
}
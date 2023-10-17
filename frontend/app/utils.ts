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


export async function getDescription(addr: string) {
  try {
    const response = await fetch(`/api?address=${encodeURIComponent(addr)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('addr:', addr);
      console.log('response:', response);
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.description) {
      return data.description;
    } else {
      throw new Error('Description not found in the response');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching description: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}
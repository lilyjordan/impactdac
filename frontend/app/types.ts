import { ethers } from "ethers";


export type DACProperties = {
  arbitrator?: string;
  deadline?: bigint;
  goal?: bigint;
  contribCompPct?: bigint;
  sponsorCompPct?: bigint;
  title?: string;
};

export type RequiredDACProperties = Required<DACProperties>;

export type ContractData = RequiredDACProperties & {
  contract: ethers.Contract,
  address: string;
  sponsor: string;
  fundingState: string;
  amountPledged: bigint;
}

export type ContributeForm = {
  dacAddress: string;
  amount: string;
};

export type ApprovePayoutForm = {
  dacAddressPayout: string;
  founder: string;
};

export type RefundForm = {
  dacAddressRefund: string;
};

export type ClaimCompForm = {
  dacAddressClaim: string;
};

export type AppState = {
  formContribute: ContributeForm;
  formApprovePayout: ApprovePayoutForm;
  formRefund: RefundForm;
  formClaimComp: ClaimCompForm;
  userAddress?: string;
  contracts: { [key: string] : ContractData };
  txBeingSent?: string;
  messageDuringTx?: string;
  transactionError?: string;
  networkError?: string;
  showSponsorModal: boolean;
  activeContractModal: string | null;
}

export type Network = {
  hardhat: string;
  anvil: string;
  sepolia: string;
  goerli: string;
  polygon_mainnet: string;
  [key: string]: string; // index signature
}

export type EnumDefinitions = {
  State: { [key: string]: string };
};
export type CreateDACForm = {
  arbitrator?: string;
  deadline?: number;
  goal?: number;
  contribCompPct?: number;
  sponsorCompPct?: number;
  title?: string;
};

export type SubmittedCreateDACForm = Required<CreateDACForm>;

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
  formCreateDAC: CreateDACForm;
  formContribute: ContributeForm;
  formApprovePayout: ApprovePayoutForm;
  formRefund: RefundForm;
  formClaimComp: ClaimCompForm;
  selectedAddress?: string;
  DACs: any[];
  txBeingSent?: string;
  messageDuringTx?: string;
  transactionError?: string;
  networkError?: string;
}

export type Network = {
  hardhat: string;
  anvil: string;
  sepolia: string;
  goerli: string;
  polygon_mainnet: string;
  [key: string]: string; // index signature
}
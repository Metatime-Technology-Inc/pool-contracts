interface IContracts {
  [key: string]: Object;
  core: {
    Distributor: string;
    LiquidityPool: string;
    MetatimeToken: string;
    PrivateSaleTokenDistributor: string;
    StrategicPool: string;
    TokenDistributor: string;
    MTC: string;
  };
  utils: {
    DistributorProxyManager: string;
    InitializedProxy: string;
    MultiSigWallet: string;
    TokenDistributorProxyManager: string;
  };
}

const CONTRACTS: IContracts = {
  core: {
    Distributor: "Distributor",
    LiquidityPool: "LiquidityPool",
    MetatimeToken: "MetatimeToken",
    PrivateSaleTokenDistributor: "PrivateSaleTokenDistributor",
    StrategicPool: "StrategicPool",
    TokenDistributor: "TokenDistributor",
    MTC: "MTC",
  },
  utils: {
    DistributorProxyManager: "DistributorProxyManager",
    InitializedProxy: "InitializedProxy",
    MultiSigWallet: "MultiSigWallet",
    TokenDistributorProxyManager: "TokenDistributorProxyManager"
  }
};

export default CONTRACTS;

interface IContracts {
  [key: string]: Object;
  core: {
    Distributor: string;
    LiquidityPool: string;
    MTC: string;
    PrivateSaleTokenDistributor: string;
    StrategicPool: string;
    TokenDistributor: string;
  };
  lib: {
    Trigonometry: string;
  },
  utils: {
    MultiSigWallet: string;
    PoolFactory: string;
  };
}

const CONTRACTS: IContracts = {
  core: {
    Distributor: "Distributor",
    LiquidityPool: "LiquidityPool",
    MTC: "MTC",
    PrivateSaleTokenDistributor: "PrivateSaleTokenDistributor",
    StrategicPool: "StrategicPool",
    TokenDistributor: "TokenDistributor",
  },
  lib: {
    Trigonometry: "Trigonometry",
  },
  utils: {
    MultiSigWallet: "MultiSigWallet",
    PoolFactory: "PoolFactory"
  }
};

export default CONTRACTS;

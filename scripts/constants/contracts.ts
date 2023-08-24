interface IContracts {
  [key: string]: Object;
  core: {
    Distributor: string;
    LiquidityPool: string;
    MTC: string;
    StrategicPool: string;
    TokenDistributor: string;
    TokenDistributorWithNoVesting: string;
  };
  lib: {
    Trigonometry: string;
    MockTrigonometry: string;
  },
  utils: {
    Multicall3: string;
    MultiSigWallet: string;
    PoolFactory: string;
  };
}

const CONTRACTS: IContracts = {
  core: {
    Distributor: "Distributor",
    LiquidityPool: "LiquidityPool",
    MTC: "MTC",
    StrategicPool: "StrategicPool",
    TokenDistributor: "TokenDistributor",
    TokenDistributorWithNoVesting: "TokenDistributorWithNoVesting",
  },
  lib: {
    Trigonometry: "Trigonometry",
    MockTrigonometry: "MockTrigonometry",
  },
  utils: {
    Multicall3: "Multicall3",
    MultiSigWallet: "MultiSigWallet",
    PoolFactory: "PoolFactory"
  }
};

export default CONTRACTS;

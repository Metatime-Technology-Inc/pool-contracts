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
    MockTrigonometry: string;
  },
  utils: {
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
    MockTrigonometry: "MockTrigonometry",
  },
  utils: {
    PoolFactory: "PoolFactory"
  }
};

export default CONTRACTS;

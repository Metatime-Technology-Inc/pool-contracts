interface IContracts {
  [key: string]: Object;
  core: {
    Distributor: string;
    LiquidityPool: string;
    MTC: string;
    StrategicPool: string;
    TokenDistributor: string;
    TokenDistributor2: string;
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
    StrategicPool: "StrategicPool",
    TokenDistributor: "TokenDistributor",
    TokenDistributor2: "TokenDistributor2",
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

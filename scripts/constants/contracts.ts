interface IContracts {
  [key: string]: Object;
  core: {
    AddressList: string;
    Distributor: string;
    LiquidityPool: string;
    MTC: string;
    StrategicPool: string;
    TokenDistributor: string;
  };
  lib: {
    Trigonometry: string;
    MockTrigonometry: string;
  },
  utils: {
    AirdropFactory: string;
    PoolFactory: string;
  };
}

const CONTRACTS: IContracts = {
  core: {
    AddressList: "AddressList",
    Distributor: "Distributor",
    LiquidityPool: "LiquidityPool",
    MTC: "MTC",
    StrategicPool: "StrategicPool",
    TokenDistributor: "TokenDistributor",
  },
  lib: {
    Trigonometry: "Trigonometry",
    MockTrigonometry: "MockTrigonometry",
  },
  utils: {
    AirdropFactory: "AirdropFactory",
    PoolFactory: "PoolFactory"
  }
};

export default CONTRACTS;

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONSTRUCTOR_PARAMS, CONTRACTS } from "../constants";

const func: DeployFunction = async ({
    deployments,
    ethers,
    getChainId,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const mtc = await deploy(CONTRACTS.core.MTC, {
        from: deployer,
        args: [CONSTRUCTOR_PARAMS.MTC.totalSupply],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log("MTC deployed at", mtc.address);

    const liquidityPool = await deploy(CONTRACTS.core.LiquidityPool, {
        from: deployer,
        args: [mtc.address],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log("Liquidity pool deployed at", liquidityPool.address);

    const strategicPool = await deploy(CONTRACTS.core.StrategicPool, {
        from: deployer,
        args: [mtc.address],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log("Strategic pool deployed at", strategicPool.address);

    const poolFactory = await deploy(CONTRACTS.utils.PoolFactory, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log("Pool factory deployed at", poolFactory.address);

    const OWNERS = [
        "0xEC15f0D43A6873e9A0Faa2AB52555B2d2926AB1e",
        "0x27bDa908C228f0A90e8c4600cD9205A80c953B69",
        "0x5be977D7df9e58224fECEf69C7729c9fF56bbbf6",
    ];

    const multiSigWallet = await deploy(CONTRACTS.utils.MultiSigWallet, {
        from: deployer,
        args: [OWNERS, 2],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log("MultiSigWallet deployed at", multiSigWallet.address);

    // // Pools that is derived from Distributor contract
    // const distributors = filterObject(POOL_PARAMS, ([k, v]) => v.baseContract === BaseContract.Distributor);

    // const distributorKeys = Object.keys(distributors);

    // // Pools that is derived from TokenDistributor contract
    // const tokenDistributors = filterObject(POOL_PARAMS, ([k, v]) => v.baseContract === BaseContract.TokenDistributor);

    // const tokenDistributorKeys = Object.keys(tokenDistributors);
};

export default func;

func.dependencies = ["MTC"];

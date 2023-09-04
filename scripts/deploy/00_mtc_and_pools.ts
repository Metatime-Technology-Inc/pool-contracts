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

    try {
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
    } catch (err) {
        console.log(err);
    }
};

export default func;

func.dependencies = ["MTC"];

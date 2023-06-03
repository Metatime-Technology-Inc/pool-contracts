import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";
import POOL_PARAMS, { BaseContract } from "../constants/pool-params";
import { filterObject } from "../helpers";

const func: DeployFunction = async ({
    deployments,
    ethers,
    getChainId,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const { deployer, feeCollector } = await getNamedAccounts();

    // const deployerSigner = await ethers.getSigner(deployer);

    const mtc = await deploy(CONTRACTS.core.MTC, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log("MTC deployed at", mtc.address);

    // // Pools that is derived from Distributor contract
    // const distributors = filterObject(POOL_PARAMS, ([k, v]) => v.baseContract === BaseContract.Distributor);

    // const distributorKeys = Object.keys(distributors);

    // // Pools that is derived from TokenDistributor contract
    // const tokenDistributors = filterObject(POOL_PARAMS, ([k, v]) => v.baseContract === BaseContract.TokenDistributor);

    // const tokenDistributorKeys = Object.keys(tokenDistributors);
};

export default func;

func.dependencies = [];

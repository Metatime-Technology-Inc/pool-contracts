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

    const distributorImplementation = await deploy(CONTRACTS.core.Distributor, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log("Distributor deployed at", distributorImplementation.address);

    const tokenDistributorImplementation = await deploy(CONTRACTS.core.TokenDistributor, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log("TokenDistributor deployed at", tokenDistributorImplementation.address);
};

export default func;

func.dependencies = ["MTC"];

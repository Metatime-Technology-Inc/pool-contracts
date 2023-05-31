import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONTRACTS } from "../constants";

const func: DeployFunction = async ({
    deployments,
    ethers,
    getChainId,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const { deployer, feeCollector } = await getNamedAccounts();

    const deployerSigner = await ethers.getSigner(deployer);

    const metatimeToken = await deploy(CONTRACTS.core.MetatimeToken, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log("Metatime Token deployed at", metatimeToken.address);
};

export default func;

func.dependencies = [];

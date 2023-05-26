// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { DeployFunction } from "hardhat-deploy/types";
// import { CONSTRUCTOR_PARAMS, CONTRACTS } from "../constants";
// import { DistributorProxyManager__factory } from "../../typechain-types";

// const func: DeployFunction = async ({
//     deployments,
//     ethers,
//     getChainId,
//     getNamedAccounts,
// }: HardhatRuntimeEnvironment) => {
//     const { deploy } = deployments;
//     const { deployer, feeCollector } = await getNamedAccounts();

//     const deployerSigner = await ethers.getSigner(deployer);

//     const distributorProxyManager = await deploy(CONTRACTS.utils.DistributorProxyManager, {
//         from: deployer,
//         args: [],
//         log: true,
//         skipIfAlreadyDeployed: true,
//     });

//     console.log("DistributorProxyManager contract deployed at", distributorProxyManager.address);

//     const dpm = DistributorProxyManager__factory.connect(distributorProxyManager.address, deployerSigner);
// };

// export default func;

// func.dependencies = [];

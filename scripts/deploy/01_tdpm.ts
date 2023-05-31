// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { DeployFunction } from "hardhat-deploy/types";
// import { CONSTRUCTOR_PARAMS, CONTRACTS } from "../constants";
// import { TokenDistributorProxyManager__factory } from "../../typechain-types";
// import POOL_PARAMS from "../constants/pool-params";
// import { getBlockTimestamp } from "../helpers";

// const func: DeployFunction = async ({
//   deployments,
//   ethers,
//   getChainId,
//   getNamedAccounts,
// }: HardhatRuntimeEnvironment) => {
//   const { deploy } = deployments;
//   const { deployer, feeCollector } = await getNamedAccounts();

//   const deployerSigner = await ethers.getSigner(deployer);

//   const tokenDistributorProxyManager = await deploy(CONTRACTS.utils.TokenDistributorProxyManager, {
//     from: deployer,
//     args: [],
//     log: true,
//     skipIfAlreadyDeployed: true,
//   });

//   console.log("TokenDistributorProxyManager contract deployed at", tokenDistributorProxyManager.address);

//   // const tdpm = TokenDistributorProxyManager__factory.connect(tokenDistributorProxyManager.address, deployerSigner);
// };

// export default func;

// func.dependencies = [];

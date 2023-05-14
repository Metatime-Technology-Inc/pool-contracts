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
  const { deployer, feeCollector } = await getNamedAccounts();

  const MTC_TOTAL_SUPPLY = 10_000_000_000 * 10 ** 18;

  const tokenDistributorProxyManager = await deploy(CONTRACTS.utils.TokenDistributorProxyManager, {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  console.log("TokenDistributorProxyManager contract deployed at", tokenDistributorProxyManager.address);

  const t = await tokenDistributorProxyManager.createPool();

  const distributorProxyManager = await deploy(CONTRACTS.utils.DistributorProxyManager, {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  console.log("DistributorProxyManager contract deployed at", distributorProxyManager.address);

  const mtc = await deploy(CONTRACTS.core.MTC, {
    from: deployer,
    args: [],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  console.log("TokenDistributorProxyManager contract deployed at", mtc.address);
};

export default func;

func.dependencies = [];

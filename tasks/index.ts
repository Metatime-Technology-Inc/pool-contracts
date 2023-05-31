import { task } from "hardhat/config";
import fs from "fs";
import path from "path";
import { CONTRACTS } from "../scripts/constants";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
// import { TokenDistributorProxyManager__factory } from "../typechain-types";
import { toWei } from "../scripts/helpers";
import util from 'util';
const exec = util.promisify(require('child_process').exec);

// task(
//     "create-td-proxies",
//     async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
//         try {
//             const networkName = hre.network.name;
//             const { deployer, feeCollector } = await hre.getNamedAccounts();
//             const deployerSigner = await hre.ethers.getSigner(deployer);

//             const tdpm = TokenDistributorProxyManager__factory.connect(deployerSigner,);

//             console.log("Task completed!");
//         } catch (e) {
//             console.log(e);
//         }
//     }
// );

// task(
//   "extract-abis",
//   async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
//     try {
//       const networkName = hre.network.name;

//       for (const contractSection in CONTRACTS) {
//         const sectionObj = CONTRACTS[contractSection];
//         const objKeys = Object.keys(sectionObj);

//         for (let i = 0; i < objKeys.length; i++) {
//           const innerSection = objKeys[i];
//           const originFilePath = path.resolve(
//             __dirname,
//             `../artifacts/contracts/${contractSection}/${innerSection}.sol/${innerSection}.json`
//           );
//           if (!fs.existsSync(originFilePath)) {
//             console.log(originFilePath, "not found!");
//             break;
//           }
//           const abisFilePath = path.resolve(
//             __dirname,
//             `../tmp/abis/${networkName}/${innerSection}.json`
//           );

//           const abisDir = path.resolve(__dirname, `../tmp/abis`);

//           const abisNetworkDir = path.resolve(
//             __dirname,
//             `../tmp/abis/${networkName}`
//           );

//           if (!fs.existsSync(abisNetworkDir)) {
//             fs.mkdirSync(abisDir);
//             fs.mkdirSync(abisNetworkDir);
//           }

//           const file = fs.readFileSync(originFilePath, "utf8");
//           const abi = JSON.parse(file);
//           fs.writeFileSync(abisFilePath, JSON.stringify(abi), "utf8");
//         }
//       }

//       console.log("Task completed!");
//     } catch (e) {
//       console.log(e);
//     }
//   }
// );

// task(
//   "extract-deployment-addresses",
//   async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
//     try {
//       const networkName = hre.network.name;

//       const [deployer] = await hre.ethers.getSigners();

//       let obj: { [key: string]: string; } = {};

//       const deploymentsFolder = path.resolve(__dirname, `../tmp/deployments`);

//       if (!fs.existsSync(deploymentsFolder)) {
//         fs.mkdirSync(deploymentsFolder);
//       }

//       const deploymentsFilePath = path.resolve(
//         __dirname,
//         `../tmp/deployments/${networkName}.json`
//       );

//       if (networkName === "elanor") {
//         delete CONTRACTS["mocks"]["MockERC20"];
//         delete CONTRACTS["mocks"]["MockERC721"];
//       }

//       delete CONTRACTS["utils"]["Divisible"];
//       delete CONTRACTS["utils"]["Fractional"];

//       for (const contractSection in CONTRACTS) {
//         const sectionObj = CONTRACTS[contractSection];
//         const objKeys = Object.keys(sectionObj);

//         for (let i = 0; i < objKeys.length; i++) {
//           const innerSection = objKeys[i];
//           const originFilePath = path.resolve(
//             __dirname,
//             `../deployments/${networkName}/${innerSection}.json`
//           );

//           if (!fs.existsSync(originFilePath)) {
//             console.log(originFilePath, "not found!");
//           }

//           if (fs.existsSync(originFilePath)) {
//             const file = fs.readFileSync(originFilePath, "utf8");
//             const abi = JSON.parse(file);
//             obj[innerSection] = abi.address;
//           }
//         }
//       }

//       fs.writeFileSync(deploymentsFilePath, JSON.stringify(obj), "utf8");

//       console.info(
//         "- Deployments on",
//         networkName,
//         "network were written to ./tmp/deployments/" +
//         networkName +
//         ".json file."
//       );

//       const instances: IInstances = prepareInstances(deployer, networkName);

//       const dpm = instances.utils.DivisibleProxyManager;
//       const fpm = instances.utils.FractionalProxyManager;

//       const dpmLogic = await dpm.logic();
//       const fpmLogic = await fpm.logic();

//       obj["DivisibleProxyManager-Logic"] = dpmLogic;
//       obj["FractionalProxyManager-Logic"] = fpmLogic;

//       fs.writeFileSync(deploymentsFilePath, JSON.stringify(obj), "utf8");

//       console.log("Task completed!");
//     } catch (e) {
//       console.log(e);
//     }
//   }
// );
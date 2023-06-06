import { task } from "hardhat/config";
import fs from "fs";
import path from "path";
import { CONTRACTS } from "../scripts/constants";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { toWei } from "../scripts/helpers";
import { ethers } from "ethers";

task("create-distributor", "Create a new distributor")
    .addParam("factory", "address of pool factory")
    .addParam("name", "name of pool")
    .addParam("mtc", "address of mtc")
    .addParam("start", "start timestamp of distribution")
    .addParam("end", "end timestamp of distribution")
    .addParam("rate", "distribution rate")
    .addParam("length", "length of the claim period")
    .addParam("amount", "claimable amount in pool")
    .setAction(async (args, hre) => {
        try {
            const { name, mtc, start, end, rate, length, amount, factory } = args;

            if (!factory || !name || !mtc || !start || !end || !rate || !length || !amount) {
                throw new Error("Missing arguments!");
            }

            const factoryAddress = ethers.utils.getAddress(factory);
            const mtcAddress = ethers.utils.getAddress(mtc);

            const networkName = hre.network.name;
            const { deployer } = await hre.getNamedAccounts();
            const deployerSigner = await hre.ethers.getSigner(deployer);

            const { PoolFactory__factory } = require("../typechain-types");

            const poolFactory = PoolFactory__factory.connect(factoryAddress, deployerSigner);

            const createDistributorTx = await poolFactory.createDistributor(
                String(name),
                mtcAddress,
                Number(start),
                Number(end),
                Number(rate),
                Number(length),
                toWei(amount)
            );

            const createDistributor = await createDistributorTx.wait();
            const event = createDistributor.events?.find((event: any) => event.event === "DistributorCreated");
            const [creatorAddress, distributorAddress, distributorId] = event?.args!;

            console.log("NETWORK:",networkName);
            console.log(
                `[DISTRIBUTOR CREATED]\n
            -> Creator Address: ${creatorAddress}\n
            -> Distributor Address: ${distributorAddress}\n
            -> Distributor Id: ${distributorId}
            `
            );
        } catch (err: any) {
            throw new Error(err);
        }
    });

task("create-token-distributor", "Create a new token distributor")
    .addParam("factory", "address of pool factory")
    .addParam("name", "name of pool")
    .addParam("mtc", "address of token")
    .addParam("start", "start timestamp of token distribution")
    .addParam("end", "end timestamp of token distribution")
    .addParam("rate", "distribution rate")
    .addParam("length", "length of the claim period")
    .setAction(async (args, hre) => {
        try {
            const { factory, name, mtc, start, end, rate, length } = args;

            if (!name || !mtc || !start || !end || !rate || !length || !factory) {
                throw new Error("Missing arguments!");
            }

            const factoryAddress = ethers.utils.getAddress(factory);
            const mtcAddress = ethers.utils.getAddress(mtc);

            const networkName = hre.network.name;
            const { deployer } = await hre.getNamedAccounts();
            const deployerSigner = await hre.ethers.getSigner(deployer);

            const { PoolFactory__factory } = require("../typechain-types");

            const poolFactory = PoolFactory__factory.connect(factoryAddress, deployerSigner);

            const createTokenDistributorTx = await poolFactory.createTokenDistributor(
                String(name),
                mtcAddress,
                Number(start),
                Number(end),
                Number(rate),
                Number(length)
            );

            const createTokenDistributor = await createTokenDistributorTx.wait();
            const event = createTokenDistributor.events?.find((event: any) => event.event === "TokenDistributorCreated");
            const [creatorAddress, tokenDistributorAddress, tokenDistributorId] = event?.args!;

            console.log("NETWORK:",networkName);
            console.log(
                `[TOKEN DISTRIBUTOR CREATED]\n
            -> Creator Address: ${creatorAddress}\n
            -> Distributor Address: ${tokenDistributorAddress}\n
            -> Distributor Id: ${tokenDistributorId}
            `
            );
        } catch (err: any) {
            throw new Error(err);
        }
    });

task("create-private-sale", "Create a private sale pool")
    .addParam("mtc", "address of mtc")
    .addParam("start", "start timestamp of token distribution")
    .addParam("end", "end timestamp of token distribution")
    .setAction(async (args, hre) => {
        try {
            const { mtc, start, end } = args;

            if (!mtc || !start || !end) {
                throw new Error("Missing arguments!");
            }

            const mtcAddress = ethers.utils.getAddress(mtc);

            const networkName = hre.network.name;
            const { deployer } = await hre.getNamedAccounts();
            const deployerSigner = await hre.ethers.getSigner(deployer);

            const PrivateSaleTokenDistributor = await hre.ethers.getContractFactory(CONTRACTS.core.PrivateSaleTokenDistributor);
            const privateSaleTokenDistributor = await PrivateSaleTokenDistributor.connect(deployerSigner).deploy(
                mtcAddress,
                Number(start),
                Number(end),
            );

            await privateSaleTokenDistributor.deployed();

            console.log("NETWORK:",networkName);
            console.log("PrivateSaleTokenDistributor deployed at", privateSaleTokenDistributor.address);
        } catch (err: any) {
            throw new Error(err);
        }
    });


task(
    "extract-abis",
    async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        try {
            const networkName = hre.network.name;

            for (const contractSection in CONTRACTS) {
                const sectionObj = CONTRACTS[contractSection];
                const objKeys = Object.keys(sectionObj);

                for (let i = 0; i < objKeys.length; i++) {
                    const innerSection = objKeys[i];
                    const originFilePath = path.resolve(
                        __dirname,
                        `../artifacts/contracts/${contractSection}/${innerSection}.sol/${innerSection}.json`
                    );
                    if (!fs.existsSync(originFilePath)) {
                        console.log(originFilePath, "not found!");
                        break;
                    }
                    const abisFilePath = path.resolve(
                        __dirname,
                        `../tmp/abis/${networkName}/${innerSection}.json`
                    );

                    const abisDir = path.resolve(__dirname, `../tmp/abis`);

                    const abisNetworkDir = path.resolve(
                        __dirname,
                        `../tmp/abis/${networkName}`
                    );

                    if (!fs.existsSync(abisNetworkDir)) {
                        fs.mkdirSync(abisDir);
                        fs.mkdirSync(abisNetworkDir);
                    }

                    const file = fs.readFileSync(originFilePath, "utf8");
                    const abi = JSON.parse(file);
                    fs.writeFileSync(abisFilePath, JSON.stringify(abi), "utf8");
                }
            }

            console.log("Task completed!");
        } catch (e) {
            console.log(e);
        }
    }
);

task(
    "extract-deployment-addresses",
    async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        try {
            const networkName = hre.network.name;

            const [deployer] = await hre.ethers.getSigners();

            let obj: { [key: string]: string; } = {};

            const deploymentsFolder = path.resolve(__dirname, `../tmp/deployments`);

            if (!fs.existsSync(deploymentsFolder)) {
                fs.mkdirSync(deploymentsFolder);
            }

            const deploymentsFilePath = path.resolve(
                __dirname,
                `../tmp/deployments/${networkName}.json`
            );

            for (const contractSection in CONTRACTS) {
                const sectionObj = CONTRACTS[contractSection];
                const objKeys = Object.keys(sectionObj);

                for (let i = 0; i < objKeys.length; i++) {
                    const innerSection = objKeys[i];
                    const originFilePath = path.resolve(
                        __dirname,
                        `../deployments/${networkName}/${innerSection}.json`
                    );

                    if (!fs.existsSync(originFilePath)) {
                        console.log(originFilePath, "not found!");
                    }

                    if (fs.existsSync(originFilePath)) {
                        const file = fs.readFileSync(originFilePath, "utf8");
                        const abi = JSON.parse(file);
                        obj[innerSection] = abi.address;
                    }
                }
            }

            fs.writeFileSync(deploymentsFilePath, JSON.stringify(obj), "utf8");

            console.info(
                "- Deployments on",
                networkName,
                "network were written to ./tmp/deployments/" +
                networkName +
                ".json file."
            );

            fs.writeFileSync(deploymentsFilePath, JSON.stringify(obj), "utf8");

            console.log("Task completed!");
        } catch (e) {
            console.log(e);
        }
    }
);
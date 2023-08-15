import { task } from "hardhat/config";
import fs from "fs";
import path from "path";
import { toWei } from "../scripts/helpers";
import { ethers } from "ethers";

// creates new Distributor by using PoolFactory for given network
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

            console.log("NETWORK:", networkName);
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

// creates new TokenDistributor by using PoolFactory for given network
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

            console.log("NETWORK:", networkName);
            console.log(
                `[TOKEN DISTRIBUTOR CREATED]\n
            -> Creator Address: ${creatorAddress}\n
            -> Distributor Address: ${tokenDistributorAddress}\n
            -> Distributor Id: ${tokenDistributorId}
            `
            );
        } catch (err: any) {
            console.log(err);
            throw new Error(err);
        }
    });

// submit new pool
task("submit-pool", "Submit new mtc pool")
    .addParam("mtc", "address of mtc")
    .addParam("name", "name of the pool")
    .addParam("addr", "address of the pool")
    .addParam("amount", "locked amount in the pool")
    .setAction(async (args, hre) => {
        try {
            const { mtc, name, addr, amount } = args;

            if (!mtc || !name || !addr || !amount) {
                throw new Error("Missing arguments!");
            }

            const mtcAddress = ethers.utils.getAddress(mtc);

            const networkName = hre.network.name;
            const { deployer } = await hre.getNamedAccounts();
            const deployerSigner = await hre.ethers.getSigner(deployer);

            const { MTC__factory } = require("../typechain-types");
            const mtcInstance = MTC__factory.connect(mtcAddress, deployerSigner);

            const poolStruct = {
                name,
                addr,
                lockedAmount: toWei(String(amount)),
            };
            const submitPoolsTx = await mtcInstance.submitPools([poolStruct]);

            const submitPools = await submitPoolsTx.wait();
            const event = submitPools.events?.find((event: any) => event.event === "PoolSubmitted");
            const [poolName, poolAddress, lockedAmount] = event?.args!;

            console.log("NETWORK:", networkName);
            console.log(
                `Pool's submitted\n
                Pool name: ${poolName}\n
                Pool address: ${poolAddress}\n
                Locked amount: ${lockedAmount}`);
        } catch (err: any) {
            throw new Error(err);
        }
    });

// submit addresses and amounts
task("submit-addresses", "Submit new mtc pool")
    .addParam("pool", "address of the pool")
    .addParam("file", "file name of the pool")
    .setAction(async (args, hre) => {
        try {
            const { pool, file } = args;

            if (!pool || !file) {
                throw new Error("Missing arguments!");
            }

            const networkName = hre.network.name;
            const { deployer } = await hre.getNamedAccounts();
            const deployerSigner = await hre.ethers.getSigner(deployer);

            const poolAddressesPath = path.resolve(__dirname, `../data/${file}/addresses.json`);
            const poolAmountsPath = path.resolve(__dirname, `../data/${file}/amounts.json`);

            if (!fs.existsSync(poolAddressesPath) && !fs.existsSync(poolAmountsPath)) {
                throw new Error("Files are not existed!");
            }

            const addresses = require(poolAddressesPath);
            const amounts = require(poolAmountsPath);

            const addressesArr = Array(addresses)[0];
            const amountsArr = Array(amounts)[0];

            if (addressesArr.length !== amountsArr.length) {
                throw new Error("Addresses and amounts arrays length did not match!");
            }

            let currentLap = 0;
            const denominator = 100;
            const totalLap = addressesArr.length / denominator;

            console.log("===============================================================");

            while (currentLap < totalLap) {
                const lapDiff = totalLap - currentLap;
                let startIndex = 0;
                let endIndex = 0;

                startIndex = denominator * currentLap;

                if (lapDiff > 0 && lapDiff < 1) {
                    endIndex = addressesArr.length;
                } else {
                    endIndex = (denominator * currentLap) + denominator;
                }

                const addressesChunk = addressesArr.slice(startIndex, endIndex);
                const amountsChunk = amountsArr.slice(startIndex, endIndex);
                const amountsChunkToWei = amountsChunk.map((amount: number) => toWei(String(amount)));

                if (file === "private-sale") {
                    const { TokenDistributorWithNoVesting__factory } = require("../typechain-types");
                    const privateSaleDistributorInstance = TokenDistributorWithNoVesting__factory.connect(pool, deployerSigner);

                    const submitPoolsTx = await privateSaleDistributorInstance.setClaimableAmounts(addressesChunk, amountsChunkToWei);

                    const submitPools = await submitPoolsTx.wait();
                    const event = submitPools.events?.find((event: any) => event.event === "SetClaimableAmounts");
                    const [usersLength, totalClaimableAmount] = event?.args!;

                    console.log("NETWORK:", networkName);
                    console.log(
                        `Addresses & amounts are submitted to TokenDistributorWithNoVesting\n
                            Private Sale Pool address: ${pool}\n
                            Total submitted address length: ${usersLength}\n
                            Total claimable amount: ${totalClaimableAmount}`);
                } else {
                    const { TokenDistributor__factory } = require("../typechain-types");
                    const tokenDistributorInstance = TokenDistributor__factory.connect(pool, deployerSigner);
                    const poolName = await tokenDistributorInstance.poolName();

                    const submitPoolsTx = await tokenDistributorInstance.setClaimableAmounts(addressesChunk, amountsChunkToWei);

                    const submitPools = await submitPoolsTx.wait();
                    const event = submitPools.events?.find((event: any) => event.event === "SetClaimableAmounts");
                    const [usersLength, totalClaimableAmount] = event?.args!;

                    console.log("NETWORK:", networkName);
                    console.log(
                        `Addresses & amounts are submitted to TokenDistributor\n
                        Pool name: ${poolName}\n
                        Pool address: ${pool}\n
                        Total submitted address length: ${usersLength}\n
                        Total claimable amount: ${totalClaimableAmount}`
                    );
                }

                console.log("Set between", "startIndex:", startIndex, "endIndex:", endIndex);

                currentLap += 1;
            }
        } catch (err: any) {
            throw new Error(err);
        }
    });

// update pool params
task("update-pool-params", "Transfers ownership of contract")
    .addParam("pool", "token distributor address")
    .addParam("start", "new start time of pool")
    .addParam("end", "new end time of pool")
    .addParam("rate", "new distribution rate of pool")
    .addParam("length", "new period length of pool")
    .setAction(async (args, hre) => {
        try {
            const { pool, start, end, rate, length } = args;

            if (!pool || !start || !end || !rate || !length) {
                throw new Error("Missing arguments!");
            }

            const networkName = hre.network.name;
            const poolAddress = hre.ethers.utils.getAddress(pool);
            const { deployer } = await hre.getNamedAccounts();
            const deployerSigner = await hre.ethers.getSigner(deployer);

            const { TokenDistributor__factory } = require("../typechain-types");
            const tokenDistributorInstance = TokenDistributor__factory.connect(poolAddress, deployerSigner);
            const poolName = await tokenDistributorInstance.poolName();

            const updatePoolParamsTx = await tokenDistributorInstance.updatePoolParams(
                Number(start),
                Number(end),
                Number(rate),
                Number(length),
            );
            const updatePoolParams = await updatePoolParamsTx.wait();
            const event = updatePoolParams.events?.find((event: any) => event.event === "PoolParamsUpdated");
            const [newStartTime, newEndTime, newDistributionRate, newPeriodLength] = event?.args!;

            console.log("NETWORK:", networkName);
            console.log(
                `Pool params updated!\n
            Pool name: ${poolName}\n
            Pool address: ${pool}\n
            New start time ${newStartTime}\n
            New end time: ${newEndTime}\n
            New distribution rate: ${newDistributionRate}\n
            New period length: ${newPeriodLength}\n`
            );
        } catch (err: any) {
            throw new Error(err);
        }
    });
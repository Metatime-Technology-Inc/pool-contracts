import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONSTRUCTOR_PARAMS, CONTRACTS } from "../constants";
import { AirdropFactory__factory } from "../../typechain-types";
import { toWei } from "../helpers";

const func: DeployFunction = async ({
    deployments,
    ethers,
    getChainId,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const deployerSigner = await ethers.getSigner(deployer);

    const airdropFactory = await deploy(CONTRACTS.utils.AirdropFactory, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: true,
        gasPrice: toWei("0")
    });

    console.log("AirdropFactory deployed at", airdropFactory.address);

    const addressList = await deploy(CONTRACTS.core.AddressList, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: true,
        gasPrice: toWei("0")
    });

    console.log("AddressList deployed at", addressList.address);

    // for test
    // const airdropDistributors = [
    //     [
    //         "March23",
    //         Math.floor(Date.now() / 1000),
    //         Math.floor(Date.now() / 1000) + (86400 * 5),
    //         addressList.address,
    //     ],
    //     [
    //         "April23",
    //         Math.floor(Date.now() / 1000),
    //         Math.floor(Date.now() / 1000) + (86400 * 5),
    //         addressList.address,
    //     ],
    //     [
    //         "May23",
    //         Math.floor(Date.now() / 1000),
    //         Math.floor(Date.now() / 1000) + (86400 * 5),
    //         addressList.address,
    //     ],
    // ];

    // const airdropDistributorWithVestings = [
    //     [
    //         "June23",
    //         Math.floor(Date.now() / 1000),
    //         Math.floor(Date.now() / 1000) + (86400 * 5),
    //         2000,
    //         86400,
    //         addressList.address
    //     ]
    // ];

    // for live
    const requiredVestingDay = 500;
    const secondsInaDay = 60 * 24 * 60;

    const startUnix = 1704067200; // 1 January 2024
    const endUnix = 1747267200; // 1 January 2024 + 500 day = 15 May 2025
    const distributionRate = 10_000 / requiredVestingDay;
    const distributionLength = secondsInaDay * requiredVestingDay;

    const airdropDistributors = [
        [
            "March23",
            startUnix,
            endUnix,
            addressList.address,
        ],
        [
            "April23",
            startUnix,
            endUnix,
            addressList.address,
        ],
        [
            "May23",
            startUnix,
            endUnix,
            addressList.address,
        ],
    ];

    const airdropDistributorWithVestings = [
        [
            "June23",
            startUnix,
            endUnix,
            distributionRate,
            distributionLength,
            addressList.address
        ],
        [
            "July23",
            startUnix,
            endUnix,
            distributionRate,
            distributionLength,
            addressList.address
        ]
    ];

    const airdropFactoryInstance = AirdropFactory__factory.connect(airdropFactory.address, deployerSigner);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < airdropDistributors.length; i++) {
        const [airdropName, start, end, addressListAddress] = airdropDistributors[i];
        const id = await airdropFactoryInstance.createAirdropDistributor(String(airdropName), start, end, String(addressListAddress), {gasPrice: 0});
        console.log(`Airdrop distributor with the name of ${airdropName} deployed at id of ${id}`);
        await sleep(3000);
    }

    for (let i = 0; i < airdropDistributorWithVestings.length; i++) {
        const [airdropName, start, end, rate, periodLength, addressListAddress] = airdropDistributorWithVestings[i];
        const id = await airdropFactoryInstance.createAirdropDistributorWithVesting(String(airdropName), start, end, rate, periodLength, String(addressListAddress), {gasPrice: 0});
        console.log(`Airdrop distributor with vesting with the name of ${airdropName} deployed at id of ${id}`);
        await sleep(3000);
    }
};

export default func;

func.dependencies = ["AirdropFactory"];

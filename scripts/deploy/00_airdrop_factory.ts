import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { CONSTRUCTOR_PARAMS, CONTRACTS } from "../constants";
import { AirdropFactory__factory } from "../../typechain-types";

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
    });

    console.log("AirdropFactory deployed at", airdropFactory.address);

    const addressList = await deploy(CONTRACTS.core.AddressList, {
        from: deployer,
        args: [],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    console.log("AddressList deployed at", addressList.address);

    const airdropDistributors = [
        [
            "March23",
            Math.floor(Date.now() / 1000),
            Math.floor(Date.now() / 1000) + (86400 * 5),
            addressList.address,
        ],
        [
            "April23",
            Math.floor(Date.now() / 1000),
            Math.floor(Date.now() / 1000) + (86400 * 5),
            addressList.address,
        ],
        [
            "May23",
            Math.floor(Date.now() / 1000),
            Math.floor(Date.now() / 1000) + (86400 * 5),
            addressList.address,
        ],
    ];

    const airdropDistributorWithVestings = [
        [
            "June23",
            Math.floor(Date.now() / 1000),
            Math.floor(Date.now() / 1000) + (86400 * 5),
            2000,
            86400,
            addressList.address
        ]
    ];

    const airdropFactoryInstance = AirdropFactory__factory.connect(airdropFactory.address, deployerSigner);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < airdropDistributors.length; i++) {
        const [airdropName, start, end, addressListAddress] = airdropDistributors[i];
        const id = await airdropFactoryInstance.createAirdropDistributor(String(airdropName), start, end, String(addressListAddress));
        console.log(`Airdrop distributor with the name of ${airdropName} deployed at id of ${id}`);
        await sleep(3000);
    }

    for (let i = 0; i < airdropDistributorWithVestings.length; i++) {
        const [airdropName, start, end, rate, periodLength, addressListAddress] = airdropDistributorWithVestings[i];
        const id = await airdropFactoryInstance.createAirdropDistributorWithVesting(String(airdropName), start, end, rate, periodLength, String(addressListAddress));
        console.log(`Airdrop distributor with vesting with the name of ${airdropName} deployed at id of ${id}`);
        await sleep(3000);
    }
};

export default func;

func.dependencies = ["AirdropFactory"];

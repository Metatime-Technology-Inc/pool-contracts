import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { CONTRACTS } from "../scripts/constants";
import { incrementBlocktimestamp, toWei, getBlockTimestamp, calculateClaimableAmount } from "../scripts/helpers";
import { AddressList, AirdropFactory, AirdropDistributor__factory, AirdropDistributorWithVesting__factory } from "../typechain-types";
import { BigNumber } from "ethers";

const SECONDS_IN_A_DAY = 60 * 24 * 60;
const TWO_DAYS_IN_SECONDS = 2 * SECONDS_IN_A_DAY;

describe("AirdropFactory", function () {
    async function initiateVariables() {
        const [deployer, user_1] =
            await ethers.getSigners();

        const AirdropFactory = await ethers.getContractFactory(
            CONTRACTS.utils.AirdropFactory
        );
        const airdropFactory = await AirdropFactory.connect(deployer).deploy() as AirdropFactory;
        await airdropFactory.deployed();

        const AddressList = await ethers.getContractFactory(
            CONTRACTS.core.AddressList
        );
        const addressList = await AddressList.connect(deployer).deploy() as AddressList;
        await addressList.deployed();

        return {
            airdropFactory,
            addressList,
            deployer,
            user_1
        };
    }

    // Test Distributor
    describe("Create Distributor and test claiming period", async () => {
        let currentBlockTimestamp: number;
        const AD_NAME = "March23";
        let AD_START_TIME: number;
        let AD_END_TIME: number;

        const ADWV_NAME = "June23";
        let ADWV_START_TIME: number;
        let ADWV_END_TIME: number;
        let ADWV_DISTRIBUTION_RATE: number;
        const ADWV_PERIOD_LENGTH = 86400;

        const USER_ID = 1;

        this.beforeAll(async () => {
            currentBlockTimestamp = await getBlockTimestamp(ethers);
            AD_START_TIME = currentBlockTimestamp;
            AD_END_TIME = AD_START_TIME + TWO_DAYS_IN_SECONDS;

            ADWV_START_TIME = currentBlockTimestamp;
            ADWV_END_TIME = ADWV_START_TIME + TWO_DAYS_IN_SECONDS;
            ADWV_DISTRIBUTION_RATE = 5000;
        });

        it("add user to address list", async () => {
            const { user_1, deployer, addressList } = await loadFixture(initiateVariables);

            await addressList.connect(deployer).setWalletAddress(USER_ID, user_1.address);

            await expect(
                addressList.connect(deployer).setWalletAddress(USER_ID, user_1.address)
            ).to.be.revertedWith("AddressList: userID already issued");

            const userIds = [(USER_ID + 1), (USER_ID + 2)];
            const wallets = ["0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000002"];

            await addressList.connect(deployer).setWalletAddresses(userIds, wallets);

            await expect(
                addressList.connect(deployer).setWalletAddresses([USER_ID], wallets)
            ).to.be.revertedWith("AddressList: Provided data incorrect");

            await expect(
                addressList.connect(deployer).setWalletAddresses([0, USER_ID], wallets)
            ).to.be.revertedWith("AddressList: Cant set to id 0");

            await expect(
                addressList.connect(deployer).setWalletAddresses([30, 40], ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000003"])
            ).to.be.revertedWith("AddressList: Cant set zero address");
        });

        it("create airdrop distributor", async () => {
            const { airdropFactory, addressList, deployer, user_1 } = await loadFixture(initiateVariables);

            await airdropFactory.connect(deployer).createAirdropDistributor(AD_NAME, AD_START_TIME, AD_END_TIME, addressList.address);

            const distributorAddress = await airdropFactory.airdropDistributors(0);

            await addressList.connect(deployer).setWalletAddress(USER_ID, user_1.address);

            const distributorInstance = AirdropDistributor__factory.connect(distributorAddress, deployer);

            await expect(distributorInstance.setClaimableAmounts([USER_ID], [10000000000000])).to.be.revertedWith("AirdropDistributor: total claimable amount does not match");

            const CLAIMABLE_AMOUNT = BigNumber.from(10000000000000);

            // 20k gwei
            await deployer.sendTransaction({
                to: distributorAddress,
                value: CLAIMABLE_AMOUNT.mul(2),
            });

            await distributorInstance.connect(deployer).setClaimableAmounts([USER_ID], [CLAIMABLE_AMOUNT]);

            await incrementBlocktimestamp(ethers, SECONDS_IN_A_DAY);

            const user_1BalanceBefore = await ethers.provider.getBalance(user_1.address);
            await distributorInstance.connect(user_1).claim({ gasPrice: 0 });
            const user_1BalanceAfter = await ethers.provider.getBalance(user_1.address);

            expect(user_1BalanceAfter).to.be.equal(user_1BalanceBefore.add(CLAIMABLE_AMOUNT));

            const deployerBalanceBefore = await ethers.provider.getBalance(deployer.address);
            await distributorInstance.connect(deployer).sweep({gasPrice: 0});
            const deployerBalanceAfter = await ethers.provider.getBalance(deployer.address);
            expect(deployerBalanceAfter).to.be.equal(deployerBalanceBefore.add(CLAIMABLE_AMOUNT));
            
            await expect(distributorInstance.connect(deployer).sweep()).to.be.revertedWith("AirdropDistributor: no leftovers");
        });

        it("create airdrop distributor with vesting", async () => {
            const { airdropFactory, addressList, deployer, user_1 } = await loadFixture(initiateVariables);

            await airdropFactory.connect(deployer).createAirdropDistributorWithVesting(ADWV_NAME, ADWV_START_TIME, ADWV_END_TIME, ADWV_DISTRIBUTION_RATE, ADWV_PERIOD_LENGTH, addressList.address);

            const distributorWithVestingAddress = await airdropFactory.airdropDistributorWithVestings(0);

            await addressList.connect(deployer).setWalletAddress(USER_ID, user_1.address);

            const distributorInstance = AirdropDistributorWithVesting__factory.connect(distributorWithVestingAddress, deployer);

            await expect(distributorInstance.setClaimableAmounts([USER_ID], [10000000000000])).to.be.revertedWith("AirdropVestingDistributor: total claimable amount does not match");

            const CLAIMABLE_AMOUNT = BigNumber.from(10000000000000);

            // 20k gwei
            await deployer.sendTransaction({
                to: distributorWithVestingAddress,
                value: CLAIMABLE_AMOUNT.mul(2),
            });

            await distributorInstance.connect(deployer).setClaimableAmounts([USER_ID], [CLAIMABLE_AMOUNT]);

            await incrementBlocktimestamp(ethers, SECONDS_IN_A_DAY);
    
            const user_1BalanceBefore = await ethers.provider.getBalance(user_1.address);
            const claimTx = await distributorInstance.connect(user_1).claim({ gasPrice: 0 })
            const receipt = await claimTx.wait();
            const receiptTimestamp = (await ethers.provider.getBlock(receipt.blockNumber)).timestamp;
            const cca = calculateClaimableAmount(BigNumber.from(receiptTimestamp), BigNumber.from(ADWV_START_TIME), ADWV_PERIOD_LENGTH, CLAIMABLE_AMOUNT, ADWV_DISTRIBUTION_RATE);
            const user_1BalanceAfter = await ethers.provider.getBalance(user_1.address);

            expect(user_1BalanceAfter.sub(user_1BalanceBefore)).to.be.equal(cca);

            const deployerBalanceBefore = await ethers.provider.getBalance(deployer.address);
            await distributorInstance.connect(deployer).sweep({gasPrice: 0});
            
            const deployerBalanceAfter = await ethers.provider.getBalance(deployer.address);
            expect(deployerBalanceAfter).to.be.equal(deployerBalanceBefore.add(CLAIMABLE_AMOUNT.mul(2).sub(cca)));
            
            await expect(distributorInstance.connect(deployer).sweep()).to.be.revertedWith("AirdropVestingDistributor: no leftovers");
        });
    });
});
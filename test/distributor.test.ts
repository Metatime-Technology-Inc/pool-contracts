import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import POOL_PARAMS from "../scripts/constants/pool-params";
import { incrementBlocktimestamp, toWei, getBlockTimestamp } from "../scripts/helpers";
import { BigNumber } from "ethers";

const METATIME_TOKEN_SUPPLY = 10_000_000_000;
const SECONDS_IN_A_DAY = 60 * 24 * 60;

describe("Distributor", function () {
    async function initiateVariables() {
        const [deployer, user_1, user_2, user_3, user_4, user_5] =
            await ethers.getSigners();

        const MTC = await ethers.getContractFactory(
            CONTRACTS.core.MTC
        );
        const mtc = await MTC.connect(deployer).deploy(toWei(String(METATIME_TOKEN_SUPPLY)));

        const PoolFactory = await ethers.getContractFactory(
            CONTRACTS.utils.PoolFactory
        );
        const poolFactory = await PoolFactory.connect(deployer).deploy();

        const Distributor = await ethers.getContractFactory(
            CONTRACTS.core.Distributor
        );
        const distributor = await Distributor.connect(deployer).deploy();

        return {
            mtc,
            poolFactory,
            deployer,
            distributor,
            user_1,
            user_2,
            user_3,
            user_4,
            user_5,
        };
    }

    describe("Create distributors and test claiming period", async () => {
        it("should initiate Pool factory & create distributor pool", async function () {
            const {
                mtc,
                poolFactory,
                deployer,
                user_1,
            } = await loadFixture(initiateVariables);

            const currentBlockTimestamp = await getBlockTimestamp(ethers);
            const LISTING_TIMESTAMP = currentBlockTimestamp + 500_000;

            // *** Test distributor creation
            const testDistributor = POOL_PARAMS.MARKETING_POOL;
            const truePoolInfo = {
                poolName: testDistributor.poolName,
                token: mtc.address,
                startTime: LISTING_TIMESTAMP,
                endTime: LISTING_TIMESTAMP + (testDistributor.vestingDurationInDays * SECONDS_IN_A_DAY),
                distributionRate: testDistributor.distributionRate,
                periodLength: testDistributor.periodLength,
                claimableAmount: testDistributor.lockedAmount,
            };
            const falsePoolInfo = {
                poolName: testDistributor.poolName,
                token: mtc.address,
                startTime: LISTING_TIMESTAMP,
                endTime: LISTING_TIMESTAMP + (testDistributor.vestingDurationInDays * SECONDS_IN_A_DAY) + 1000,
                distributionRate: testDistributor.distributionRate,
                periodLength: testDistributor.periodLength,
                claimableAmount: testDistributor.lockedAmount,
            };

            // -- Test false pool params and expect method to revert
            await expect(poolFactory.connect(deployer).createDistributor(
                falsePoolInfo.poolName,
                falsePoolInfo.token,
                falsePoolInfo.startTime,
                falsePoolInfo.endTime,
                falsePoolInfo.distributionRate,
                falsePoolInfo.periodLength,
                falsePoolInfo.claimableAmount
            )).to.be.revertedWith("isParamsValid: Invalid parameters!");

            // -- Test true pool params
            await poolFactory.connect(deployer).createDistributor(
                truePoolInfo.poolName,
                truePoolInfo.token,
                truePoolInfo.startTime,
                truePoolInfo.endTime,
                truePoolInfo.distributionRate,
                truePoolInfo.periodLength,
                truePoolInfo.claimableAmount
            );

            const currentDistributorId = await poolFactory.connect(deployer).distributorCount();
            expect(currentDistributorId).to.be.equal(BigNumber.from(1));

            // --- submit 0x address then test this value
            const createdDistributorAddress = await poolFactory.getDistributor(0);
            const distributorInstance = await ethers.getContractFactory(CONTRACTS.core.Distributor);
            const createdDistributor = distributorInstance.attach(createdDistributorAddress);

            // Test initialize method and expect it reverted thats because its called during pool creating
            // and only callable while creating pool
            await expect(createdDistributor.connect(deployer).initialize(
                deployer.address,
                truePoolInfo.poolName,
                mtc.address,
                truePoolInfo.startTime,
                truePoolInfo.endTime,
                truePoolInfo.distributionRate,
                truePoolInfo.periodLength,
                truePoolInfo.claimableAmount,
            )).to.be.revertedWith("Initializable: contract is already initialized");

            // Check storage variables
            const poolName = await createdDistributor.poolName();
            const token = await createdDistributor.token();
            const startTime = await createdDistributor.startTime();
            const endTime = await createdDistributor.endTime();
            const periodLength = await createdDistributor.periodLength();
            const distributionRate = await createdDistributor.distributionRate();
            const baseDivider = await createdDistributor.BASE_DIVIDER();
            const claimableAmount = await createdDistributor.claimableAmount();
            const claimedAmount_ = await createdDistributor.claimedAmount();
            const lastClaimTime = await createdDistributor.lastClaimTime();
            const leftClaimableAmount = await createdDistributor.leftClaimableAmount();

            expect(poolName).to.be.equal(truePoolInfo.poolName);
            expect(token).to.be.equal(mtc.address);
            expect(startTime).to.be.equal(truePoolInfo.startTime);
            expect(endTime).to.be.equal(truePoolInfo.endTime);
            expect(periodLength).to.be.equal(truePoolInfo.periodLength);
            expect(distributionRate).to.be.equal(truePoolInfo.distributionRate);
            expect(baseDivider).to.be.equal(10_000);
            expect(claimableAmount).to.be.equal(truePoolInfo.claimableAmount);
            expect(claimedAmount_).to.be.equal(0);
            expect(lastClaimTime).to.be.equal(truePoolInfo.startTime);
            expect(leftClaimableAmount).to.be.equal(truePoolInfo.claimableAmount);

            // extend claim period time 1 week
            const ONE_WEEK_IN_SECS = SECONDS_IN_A_DAY * 7;

            // --- try to update pool params before the claim period
            // ---- try with wrong address who is not the owner
            await expect(createdDistributor.connect(user_1).updatePoolParams(
                truePoolInfo.startTime + ONE_WEEK_IN_SECS,
                truePoolInfo.endTime + ONE_WEEK_IN_SECS,
                truePoolInfo.distributionRate,
                truePoolInfo.periodLength,
                truePoolInfo.claimableAmount,
            )).to.be.revertedWith("Ownable: caller is not the owner");

            await createdDistributor.connect(deployer).updatePoolParams(
                truePoolInfo.startTime + ONE_WEEK_IN_SECS,
                truePoolInfo.endTime + ONE_WEEK_IN_SECS,
                truePoolInfo.distributionRate,
                truePoolInfo.periodLength,
                truePoolInfo.claimableAmount,
            );

            const startTimeOfUpdatedPool = await createdDistributor.startTime();
            const endTimeOfUpdatedPool = await createdDistributor.endTime();

            expect(startTimeOfUpdatedPool).to.be.equal(truePoolInfo.startTime + ONE_WEEK_IN_SECS);
            expect(endTimeOfUpdatedPool).to.be.equal(truePoolInfo.endTime + ONE_WEEK_IN_SECS);

            // --- try to sweep pool before end of the claim period
            // ---- try with wrong address who is not the owner
            await expect(createdDistributor.connect(user_1).sweep()).to.be.revertedWith("Ownable: caller is not the owner");

            await expect(createdDistributor.connect(deployer).sweep()).to.be.revertedWith("sweep: Cannot sweep before claim end time!");

            // ---- send mtc funds to distributor contract
            await mtc.connect(deployer).submitPools([
                [truePoolInfo.poolName, createdDistributor.address, truePoolInfo.claimableAmount]
            ]);

            // --- calculate claimable amount after some time passed
            await incrementBlocktimestamp(ethers, 500_000 + ONE_WEEK_IN_SECS * 2);

            const calculatedClaimableAmountFor7Days = await createdDistributor.calculateClaimableAmount();
            // console.log(calculatedClaimableAmountFor7Days);
            // expect(calculatedClaimableAmountFor7Days).to.be.equal(BigNumber.from("11200833333333333332800000"));

            const balanceBeforeClaim = await mtc.balanceOf(deployer.address);

            await createdDistributor.connect(deployer).claim();

            const balanceAfterClaim = await mtc.balanceOf(deployer.address);

            const claimedAmount = await createdDistributor.claimedAmount();
            expect(balanceAfterClaim).to.be.equal(BigNumber.from(balanceBeforeClaim).add(claimedAmount));

            // --- try to update pool params after the claim period
            await expect(createdDistributor.connect(deployer).updatePoolParams(
                truePoolInfo.startTime + ONE_WEEK_IN_SECS,
                truePoolInfo.endTime + ONE_WEEK_IN_SECS,
                truePoolInfo.distributionRate,
                truePoolInfo.periodLength,
                truePoolInfo.claimableAmount,
            )).to.be.revertedWith("updatePoolParams: Claim period already started.");

            // Increment timestamp after the end of claim period
            await incrementBlocktimestamp(ethers, LISTING_TIMESTAMP * 10);

            // --- calculate claimable amount after end of the claim period
            const calculatedClaimableAfterEndOfClaim = await createdDistributor.calculateClaimableAmount();
            const leftClaimableAmount_ = await createdDistributor.leftClaimableAmount();
            expect(calculatedClaimableAfterEndOfClaim).to.be.equal(leftClaimableAmount_);

            // --- claim after end of the claim period
            await createdDistributor.connect(deployer).claim();

            const leftClaimableAmount__ = await createdDistributor.leftClaimableAmount();
            console.log(leftClaimableAmount__);

            // --- try to sweep pool after end of the claim period after claiming all the remaining amount
            // it should be rejected
            await expect(createdDistributor.connect(deployer).sweep()).to.be.revertedWith("sweep: no leftovers");

            const balanceOfPool = await mtc.balanceOf(createdDistributor.address);
            expect(balanceOfPool).to.be.equal(0);

            // send funds to test sweep method
            const sentAmount = toWei(String(1_000));
            await mtc.connect(deployer).transfer(createdDistributor.address, sentAmount);
            const poolBalanceAfterTransfer = await mtc.balanceOf(createdDistributor.address);

            expect(poolBalanceAfterTransfer).to.be.equal(sentAmount);

            await createdDistributor.connect(deployer).sweep();

            const poolBalanceAfterSweep = await mtc.balanceOf(createdDistributor.address);
            expect(poolBalanceAfterSweep).to.be.equal(0);
        });
    });
});
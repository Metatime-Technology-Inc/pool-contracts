import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import POOL_PARAMS, { PoolInfo, BaseContract } from "../scripts/constants/pool-params";
import { incrementBlocktimestamp, toWei, getBlockTimestamp, filterObject } from "../scripts/helpers";
import { BigNumber } from "ethers";

const METATIME_TOKEN_SUPPLY = 10_000_000_000;
const SECONDS_IN_A_DAY = 60 * 24 * 60;

describe("PrivateSaleTokenDistributor", function () {
    async function initiateVariables() {
        const [deployer, user_1, user_2, user_3, user_4, user_5] =
            await ethers.getSigners();

        const currentBlockTimestamp = await getBlockTimestamp(ethers);
        const LISTING_TIMESTAMP = currentBlockTimestamp + 500_000;

        const MTC = await ethers.getContractFactory(
            CONTRACTS.core.MTC
        );
        const mtc = await MTC.connect(deployer).deploy(toWei(String(METATIME_TOKEN_SUPPLY)));

        const PrivateSaleTokenDistributor = await ethers.getContractFactory(
            CONTRACTS.core.PrivateSaleTokenDistributor
        );

        const periodDurationInSeconds = POOL_PARAMS.PRIVATE_SALE_POOL.vestingDurationInDays * SECONDS_IN_A_DAY;
        const privateSaleTokenDistributor = await PrivateSaleTokenDistributor.connect(deployer)
            .deploy(mtc.address, LISTING_TIMESTAMP, LISTING_TIMESTAMP + periodDurationInSeconds);

        return {
            mtc,
            privateSaleTokenDistributor,
            deployer,
            user_1,
            user_2,
            user_3,
            user_4,
            user_5,
        };
    }

    describe("Create distributors and test claiming period", async () => {
        it("Initiate Pool factory & create distributor pool", async function () {
            const {
                mtc,
                privateSaleTokenDistributor,
                deployer,
                user_1,
                user_2,
                user_3,
                user_4,
                user_5,
            } = await loadFixture(initiateVariables);

            // Set addresses and their amounts with no balance and expect revert
            const addrs = [user_1.address, user_2.address, user_3.address, user_4.address];
            const amounts = [toWei(String(10_000_000)), toWei(String(25_000_000)), toWei(String(60_000_000)), toWei(String(5_000_000))];

            await expect(privateSaleTokenDistributor.connect(deployer).setClaimableAmounts(addrs, amounts))
                .to.be.revertedWith("setClaimableAmounts: Total claimable amount does not match");

            // Send funds and try to set addresses and their amounts
            await mtc.connect(deployer).transfer(privateSaleTokenDistributor.address, POOL_PARAMS.PRIVATE_SALE_POOL.lockedAmount);

            await privateSaleTokenDistributor.connect(deployer).setClaimableAmounts(addrs, amounts);

            const user_1ClaimableAmounts = await privateSaleTokenDistributor.claimableAmounts(user_1.address);
            const user_2ClaimableAmounts = await privateSaleTokenDistributor.claimableAmounts(user_2.address);
            const user_3ClaimableAmounts = await privateSaleTokenDistributor.claimableAmounts(user_3.address);
            const user_4ClaimableAmounts = await privateSaleTokenDistributor.claimableAmounts(user_4.address);

            expect(user_1ClaimableAmounts).to.be.equal(toWei(String(10_000_000)));
            expect(user_2ClaimableAmounts).to.be.equal(toWei(String(25_000_000)));
            expect(user_3ClaimableAmounts).to.be.equal(toWei(String(60_000_000)));
            expect(user_4ClaimableAmounts).to.be.equal(toWei(String(5_000_000)));

            // Try to set addresses and their amounts after claim started and expect revert
            await incrementBlocktimestamp(ethers, 500_000);
            await expect(privateSaleTokenDistributor.connect(deployer).setClaimableAmounts([user_5.address], [toWei(String(1_000_000))]))
                .to.be.revertedWith("isSettable: Claim period has already started");

            // Try to claim tokens with wrong address
            await expect(privateSaleTokenDistributor.connect(user_5).claim())
                .to.be.revertedWith("claim: No tokens to claim");

            // Try to claim tokens with true addresses
            await privateSaleTokenDistributor.connect(user_1).claim();
            await privateSaleTokenDistributor.connect(user_2).claim();
            await privateSaleTokenDistributor.connect(user_3).claim();
            await privateSaleTokenDistributor.connect(user_4).claim();

            const user_1Balance = await mtc.balanceOf(user_1.address);
            const user_2Balance = await mtc.balanceOf(user_2.address);
            const user_3Balance = await mtc.balanceOf(user_3.address);
            const user_4Balance = await mtc.balanceOf(user_4.address);

            expect(user_1Balance).to.be.equal(toWei(String(10_000_000)));
            expect(user_2Balance).to.be.equal(toWei(String(25_000_000)));
            expect(user_3Balance).to.be.equal(toWei(String(60_000_000)));
            expect(user_4Balance).to.be.equal(toWei(String(5_000_000)));

            // Try to sweep contract balance after end of the claim period 
            // expect to be reverted because of no balance in contract
            await expect(privateSaleTokenDistributor.connect(user_5).sweep()).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(privateSaleTokenDistributor.connect(deployer).sweep()).to.be.revertedWith("sweep: No leftovers");

            // Try to sweep after funds are sent
            await mtc.connect(deployer).transfer(privateSaleTokenDistributor.address, toWei(String(1_000_000)));
            const balanceOfPoolBeforeFundsAreSent = await mtc.balanceOf(privateSaleTokenDistributor.address);
            expect(balanceOfPoolBeforeFundsAreSent).to.be.equal(toWei(String(1_000_000)));
            await privateSaleTokenDistributor.connect(deployer).sweep();
            const balanceOfPoolAfterFundsAreSent = await mtc.balanceOf(privateSaleTokenDistributor.address);
            expect(balanceOfPoolAfterFundsAreSent).to.be.equal(0);
        });
    });
});
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import { incrementBlocktimestamp, toWei, getBlockTimestamp } from "../scripts/helpers";

const PRIVATE_SALE_TOKEN_AMOUNT = 100_000_000;

describe("Private Sale Token Distributor", function () {
    async function initiateVariables() {
        const [deployer, beneficiary_1, beneficiary_2] =
            await ethers.getSigners();

        const MetatimeToken = await ethers.getContractFactory(
            CONTRACTS.core.MetatimeToken,
        );
        const metatimeToken = await MetatimeToken.connect(deployer).deploy();

        return {
            metatimeToken,
            deployer,
            beneficiary_1,
            beneficiary_2
        };
    }

    describe("Initiate", async () => {
        it("Initiate PrivateSaleTokenDistributor contract & claim amounts", async function () {
            const {
                metatimeToken,
                deployer,
                beneficiary_1,
                beneficiary_2
            } = await loadFixture(initiateVariables);

            const PrivateSaleTokenDistributor = await ethers.getContractFactory(
                CONTRACTS.core.PrivateSaleTokenDistributor
            );
            const currentBlockTimestamp = await getBlockTimestamp(ethers);
            console.log(currentBlockTimestamp);
            const START_TIME = currentBlockTimestamp + 500_000;
            // 3 months interval
            const END_TIME = START_TIME + 1_000_000;

            const privateSaleTokenDistributor = await PrivateSaleTokenDistributor.connect(deployer).deploy(metatimeToken.address, START_TIME, END_TIME);

            const sendFundsToPoolTx = await metatimeToken.connect(deployer).transfer(privateSaleTokenDistributor.address, toWei(String(PRIVATE_SALE_TOKEN_AMOUNT)));
            await sendFundsToPoolTx.wait();

            expect(await metatimeToken.balanceOf(privateSaleTokenDistributor.address)).to.be.equal(toWei(String(PRIVATE_SALE_TOKEN_AMOUNT)));

            const BENEFICIARY_AMOUNTS = 50_000_000;
            const setClaimableAmountsTx = await privateSaleTokenDistributor.connect(deployer)
                .setClaimableAmounts([beneficiary_1.address, beneficiary_2.address], [toWei(String(BENEFICIARY_AMOUNTS)), toWei(String(BENEFICIARY_AMOUNTS))]);
            await setClaimableAmountsTx.wait();

            await incrementBlocktimestamp(ethers, 1_000_000);

            const beneficiary1ClaimTx = await privateSaleTokenDistributor.connect(beneficiary_1).claim();
            await beneficiary1ClaimTx.wait();

            expect(await metatimeToken.balanceOf(beneficiary_1.address)).to.be.equal(toWei(String(BENEFICIARY_AMOUNTS)));
        });
    });
});
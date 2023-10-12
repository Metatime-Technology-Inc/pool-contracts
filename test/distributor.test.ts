import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import {
  incrementBlocktimestamp,
  toWei,
  getBlockTimestamp,
  calculateClaimableAmount,
  findMarginOfDeviation,
} from "../scripts/helpers";
import { BigNumber } from "ethers";
import {
  Distributor,
  Distributor__factory,
  PoolFactory,
  TokenDistributor,
  TokenDistributor__factory,
} from "../typechain-types";

const SECONDS_IN_A_DAY = 60 * 24 * 60;
const TWO_DAYS_IN_SECONDS = 2 * SECONDS_IN_A_DAY;

describe("Distributor", function () {
  async function initiateVariables() {
    const [deployer, user_1, user_2, user_3, user_4, user_5] =
      await ethers.getSigners();

    const PoolFactory_ = await ethers.getContractFactory(
      CONTRACTS.utils.PoolFactory
    );
    const poolFactory = (await PoolFactory_.connect(
      deployer
    ).deploy()) as PoolFactory;
    await poolFactory.deployed();

    const Distributor_ = await ethers.getContractFactory(
      CONTRACTS.core.Distributor
    );
    const distributor = (await Distributor_.connect(
      deployer
    ).deploy()) as Distributor;
    await distributor.deployed();

    const TokenDistributor_ = await ethers.getContractFactory(
      CONTRACTS.core.TokenDistributor
    );
    const tokenDistributor = (await TokenDistributor_.connect(
      deployer
    ).deploy()) as TokenDistributor;
    await tokenDistributor.deployed();

    await poolFactory
      .connect(deployer)
      .initialize(distributor.address, tokenDistributor.address);

    return {
      poolFactory,
      deployer,
      distributor,
      tokenDistributor,
      user_1,
      user_2,
      user_3,
      user_4,
      user_5,
    };
  }

  // Test Distributor
  describe("Create Distributor and test claiming period", async () => {
    let currentBlockTimestamp: number;
    const POOL_NAME = "TestDistributor";
    let START_TIME: number;
    let END_TIME: number;
    const DISTRIBUTION_RATE = 5_000;
    const PERIOD_LENGTH = 86400;
    const LOCKED_AMOUNT = toWei(String(100_000));
    let LAST_CLAIM_TIME: number;
    const LEFT_CLAIMABLE_AMOUNT = toWei(String(50_000));

    // case is to migrate left claimable amounts to new contract
    // last claim time is one day after start time
    this.beforeAll(async () => {
      currentBlockTimestamp = await getBlockTimestamp(ethers);
      START_TIME = currentBlockTimestamp + 500_000;
      LAST_CLAIM_TIME = START_TIME + SECONDS_IN_A_DAY;
      END_TIME = START_TIME + TWO_DAYS_IN_SECONDS;
    });

    it("try to create distributor from pool factory without distributor implementation and expect it to be reverted", async () => {
      const { deployer } = await loadFixture(initiateVariables);

      const TestPoolFactory_ = await ethers.getContractFactory(
        CONTRACTS.utils.PoolFactory
      );
      const testPoolFactory = (await TestPoolFactory_.connect(
        deployer
      ).deploy()) as PoolFactory;
      await testPoolFactory.deployed();

      await expect(
        testPoolFactory
          .connect(deployer)
          .createDistributor(
            POOL_NAME,
            START_TIME,
            END_TIME,
            DISTRIBUTION_RATE,
            PERIOD_LENGTH,
            LAST_CLAIM_TIME,
            LOCKED_AMOUNT,
            LEFT_CLAIMABLE_AMOUNT
          )
      ).to.be.revertedWith("PoolFactory: Distributor implementation not found");
    });

    // Try to create TokenDistributor with address who is not owner of contract and expect revert
    it("try to create TokenDistributor with address who is not owner of contract and expect revert", async () => {
      const { user_1, poolFactory } = await loadFixture(initiateVariables);

      await expect(
        poolFactory
          .connect(user_1)
          .createDistributor(
            POOL_NAME,
            START_TIME,
            END_TIME,
            DISTRIBUTION_RATE,
            PERIOD_LENGTH,
            LAST_CLAIM_TIME,
            LOCKED_AMOUNT,
            LEFT_CLAIMABLE_AMOUNT
          )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    // Try to initialize implementation and expect to be reverted
    it("try to initialize implementation and expect to be reverted", async () => {
      const { deployer, distributor, tokenDistributor, poolFactory } =
        await loadFixture(initiateVariables);

      const implementationAddress =
        await poolFactory.distributorImplementation();

      const implementationInstance = Distributor__factory.connect(
        implementationAddress,
        deployer
      );

      await expect(
        implementationInstance.initialize(
          deployer.address,
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          LAST_CLAIM_TIME,
          LOCKED_AMOUNT,
          LEFT_CLAIMABLE_AMOUNT
        )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    // Try to initialize Distributor with start time bigger than end time and expect to be reverted
    it("try to initialize Distributor with start time bigger than end time and expect to be reverted", async () => {
      const { deployer, poolFactory } = await loadFixture(initiateVariables);

      // try with wrong distribution rate
      await expect(
        poolFactory
          .connect(deployer)
          .createDistributor(
            POOL_NAME,
            END_TIME,
            START_TIME,
            DISTRIBUTION_RATE,
            PERIOD_LENGTH,
            LAST_CLAIM_TIME,
            LOCKED_AMOUNT,
            LEFT_CLAIMABLE_AMOUNT
          )
      ).to.be.revertedWith(
        "Distributor: end time must be bigger than start time"
      );
    });

    // Try to initialize TokenDistributor with correct params
    it("try to initialize Distributor with correct params", async () => {
      const { deployer, poolFactory } = await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .createDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          LAST_CLAIM_TIME,
          LOCKED_AMOUNT,
          LEFT_CLAIMABLE_AMOUNT
        );

      const distributorAddress = await poolFactory.distributors(0);
      const distributorInstance = Distributor__factory.connect(
        distributorAddress,
        deployer
      );

      expect(await distributorInstance.poolName()).to.be.equal(POOL_NAME);
      expect(await distributorInstance.startTime()).to.be.equal(START_TIME);
      expect(await distributorInstance.endTime()).to.be.equal(END_TIME);
      expect(await distributorInstance.distributionRate()).to.be.equal(
        DISTRIBUTION_RATE
      );
      expect(await distributorInstance.periodLength()).to.be.equal(
        PERIOD_LENGTH
      );
    });

    // Try to update pool params successfully
    it("try to update pool params successfully", async () => {
      const { deployer, poolFactory } = await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .createDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          LAST_CLAIM_TIME,
          LOCKED_AMOUNT,
          LEFT_CLAIMABLE_AMOUNT
        );

      const distributorAddress = await poolFactory.distributors(0);
      const distributorInstance = Distributor__factory.connect(
        distributorAddress,
        deployer
      );

      await distributorInstance.updatePoolParams(
        START_TIME + 1,
        END_TIME + 1,
        DISTRIBUTION_RATE,
        PERIOD_LENGTH,
        LOCKED_AMOUNT
      );

      expect(await distributorInstance.startTime()).to.be.equal(START_TIME + 1);
      expect(await distributorInstance.endTime()).to.be.equal(END_TIME + 1);
    });

    // Try to claim
    it("try to claim after distribution started but claim not ended", async () => {
      const { deployer, user_1, poolFactory } = await loadFixture(
        initiateVariables
      );

      await poolFactory
        .connect(deployer)
        .createDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          LAST_CLAIM_TIME,
          LOCKED_AMOUNT,
          LEFT_CLAIMABLE_AMOUNT
        );

      const distributorAddress = await poolFactory.distributors(0);
      const distributorInstance = Distributor__factory.connect(
        distributorAddress,
        deployer
      ) as Distributor;

      await expect(
        distributorInstance.connect(deployer).claim()
      ).to.be.revertedWith("Distributor: distribution has not started yet");

      await incrementBlocktimestamp(ethers, 500_000 + SECONDS_IN_A_DAY);

      await expect(
        distributorInstance.connect(user_1).claim()
      ).to.be.revertedWith("Ownable: caller is not the owner");

      const lastClaimTime = await distributorInstance.lastClaimTime();

      // try to send ether from zero balanced contract
      await expect(
        distributorInstance.connect(deployer).callStatic.claim()
      ).revertedWith("Distributor: unable to claim");

      // send ether to contract
      await network.provider.send("hardhat_setBalance", [
        distributorInstance.address,
        LOCKED_AMOUNT.toHexString(),
      ]);

      const blockTimestamp_1 = await getBlockTimestamp(ethers);

      const calculatedClaimableAmount = calculateClaimableAmount(
        BigNumber.from(blockTimestamp_1),
        lastClaimTime,
        PERIOD_LENGTH,
        LOCKED_AMOUNT,
        DISTRIBUTION_RATE
      );
      const cca = await distributorInstance.calculateClaimableAmount();

      expect(await distributorInstance.connect(deployer).callStatic.claim()).to
        .be.true;

      // expect 0 percent differences
      expect(findMarginOfDeviation(cca, calculatedClaimableAmount)).to.equal(0);

      // ----
      await incrementBlocktimestamp(ethers, 86400 * 102);
      const leftClaimableAmount =
        await distributorInstance.leftClaimableAmount();
      let deployerBalance_1 = await poolFactory.provider.getBalance(
        deployer.address
      );
      await distributorInstance.connect(deployer).claim();
      let deployerBalance_2 = await poolFactory.provider.getBalance(
        deployer.address
      );
      // expect deviation of 1 out of a million
      expect(
        findMarginOfDeviation(
          BigNumber.from(deployerBalance_1).add(leftClaimableAmount),
          deployerBalance_2
        )
      ).to.be.lessThan(0.000001);

      await expect(
        distributorInstance.connect(deployer).claim()
      ).to.be.revertedWith("calculateClaimableAmount: No tokens to claim");
    });

    it("try to send eth to distributor pool", async () => {
      const { deployer, poolFactory } = await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .createDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          LAST_CLAIM_TIME,
          LOCKED_AMOUNT,
          LEFT_CLAIMABLE_AMOUNT
        );

      const distributorAddress = await poolFactory.distributors(0);
      const distributorInstance = Distributor__factory.connect(
        distributorAddress,
        deployer
      ) as Distributor;

      await expect(
        deployer.sendTransaction({
          to: distributorInstance.address,
          value: toWei("1"),
        })
      )
        .to.emit(distributorInstance, "Deposit")
        .withArgs(deployer.address, toWei("1"), toWei("1"));
    });
  });
});

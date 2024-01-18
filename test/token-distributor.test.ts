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
  PoolFactory,
  TokenDistributor,
  TokenDistributor__factory,
  AddressList
} from "../typechain-types";
import { Address } from "hardhat-deploy/types";

const SECONDS_IN_A_DAY = 60 * 24 * 60;
const TWO_DAYS_IN_SECONDS = 2 * SECONDS_IN_A_DAY;

describe("TokenDistributor", function () {
  async function initiateVariables() {
    const [deployer, user_1, user_2, user_3, user_4, user_5, lemmeuser] =
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

    const AddressList_ = await ethers.getContractFactory(
        CONTRACTS.core.AddressList
    );
    const addressList =
      (await AddressList_.connect(
        deployer
      ).deploy()) as AddressList;
    await addressList.deployed();

    await addressList.setWalletAddresses([
        10,
        20,
        30,
        40,
        50,
        60
    ], [
        user_1.address,
        user_2.address,
        user_3.address,
        user_4.address,
        user_5.address,
        deployer.address
    ]);

    return {
      poolFactory,
      deployer,
      user_1,
      user_2,
      user_3,
      user_4,
      user_5,
      lemmeuser,
      user_1_id: 10,
      user_2_id: 20,
      user_3_id: 30,
      user_4_id: 40,
      user_5_id: 50,
      deployer_id: 60,
      distributor,
      addressList,
      tokenDistributor,
    };
  }

  // Test Token Distributor
  describe("Create TokenDistributor and test claiming period", async () => {
    let currentBlockTimestamp: number;
    const POOL_NAME = "TestTokenDistributor";
    let START_TIME: number;
    let END_TIME: number;
    const DISTRIBUTION_RATE = 5_000;
    const PERIOD_LENGTH = 86400;
    const LOCKED_AMOUNT = toWei(String(100_000));
    let LAST_CLAIM_TIME: number;

    this.beforeAll(async () => {
      currentBlockTimestamp = await getBlockTimestamp(ethers);
      START_TIME = currentBlockTimestamp + 500_000;
      END_TIME = START_TIME + TWO_DAYS_IN_SECONDS;
      LAST_CLAIM_TIME = START_TIME + SECONDS_IN_A_DAY;
    });

    // try to receive eth
    it("try to receive eth", async () => {
      const { deployer, tokenDistributor } = await loadFixture(
        initiateVariables
      );

      const SENT_AMOUNT = toWei(String(1_000));

      await expect(
        deployer.sendTransaction({
          to: tokenDistributor.address,
          value: SENT_AMOUNT,
        })
      )
        .to.emit(tokenDistributor, "Deposit")
        .withArgs(deployer.address, SENT_AMOUNT, SENT_AMOUNT);
    });

    it("try to create token distributor from pool factory without token distributor implementation and expect it to be reverted", async () => {
      const { deployer, addressList } = await loadFixture(initiateVariables);

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
          .createTokenDistributor(
            POOL_NAME,
            START_TIME,
            END_TIME,
            DISTRIBUTION_RATE,
            PERIOD_LENGTH,
            addressList.address
          )
      ).to.be.revertedWith(
        "PoolFactory: TokenDistributor implementation not found"
      );
    });

    // Try to create TokenDistributor with address who is not owner of contract and expect revert
    it("try to create TokenDistributor with address who is not owner of contract and expect revert", async () => {
      const { user_1, poolFactory, addressList } = await loadFixture(initiateVariables);

      await expect(
        poolFactory
          .connect(user_1)
          .createTokenDistributor(
            POOL_NAME,
            START_TIME,
            END_TIME,
            DISTRIBUTION_RATE,
            PERIOD_LENGTH,
            addressList.address
          )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    // Try to initialize implementation and expect to be reverted
    it("try to initialize implementation and expect to be reverted", async () => {
      const { deployer, poolFactory, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      const implementationAddress =
        await poolFactory.tokenDistributorImplementation();

      const implementationInstance = TokenDistributor__factory.connect(
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
          addressList.address
        )
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    // Try to initialize TokenDistributor with start time bigger than end time and expect to be reverted
    it("try to initialize TokenDistributor with start time bigger than end time and expect to be reverted", async () => {
      const { deployer, poolFactory, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      // try with wrong distribution rate
      await expect(
        poolFactory
          .connect(deployer)
          .createTokenDistributor(
            POOL_NAME,
            END_TIME,
            START_TIME,
            DISTRIBUTION_RATE,
            PERIOD_LENGTH,
            addressList.address
          )
      ).to.be.revertedWith(
        "TokenDistributor: end time must be bigger than start time"
      );
    });

    // Try to initialize TokenDistributor with correct params
    it("try to initialize TokenDistributor with correct params", async () => {
      const { deployer, poolFactory, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);
      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      expect(await tokenDistributorInstance.poolName()).to.be.equal(POOL_NAME);
      expect(
        await tokenDistributorInstance.distributionPeriodStart()
      ).to.be.equal(START_TIME);
      expect(
        await tokenDistributorInstance.distributionPeriodEnd()
      ).to.be.equal(END_TIME);
      expect(await tokenDistributorInstance.distributionRate()).to.be.equal(
        DISTRIBUTION_RATE
      );
      expect(await tokenDistributorInstance.periodLength()).to.be.equal(
        PERIOD_LENGTH
      );
    });

    // Try to setClaimableAmounts with mismatched users and amounts length and expect to be reverted
    it("try to setClaimableAmounts with mismatched users and amounts length and expect to be reverted", async () => {
      const {
        deployer,
        poolFactory,
        user_1,
        user_2,
        user_1_id,
        user_2_id,
        distributor,
        tokenDistributor,
        addressList
      } = await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);
      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      await expect(
        tokenDistributorInstance.setClaimableAmounts(
          [LAST_CLAIM_TIME],
          [user_1_id, user_2_id],
          [toWei("1000")],
          [toWei("500")]
        )
      ).to.be.revertedWith("TokenDistributor: lists' lengths must match");
      await expect(
        tokenDistributorInstance.setClaimableAmounts(
          [LAST_CLAIM_TIME],
          [0],
          [toWei(String(1_000))],
          [toWei("500")]
        )
      ).to.be.revertedWith("TokenDistributor: cannot set zero");
    });

    // Try to set a user who was already set and expect to be reverted
    it("try to set a user who was already set and expect to be reverted", async () => {
      const { deployer, poolFactory, user_1, user_1_id, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);
      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      await network.provider.send("hardhat_setBalance", [
        tokenDistributorInstance.address,
        toWei(String(1_500_000)).toHexString().replace(/0x0+/, "0x"),
      ]);

      await tokenDistributorInstance.setClaimableAmounts(
        [LAST_CLAIM_TIME],
        [user_1_id],
        [toWei("1000")],
        [toWei("500")]
      );
      await expect(
        tokenDistributorInstance.setClaimableAmounts(
          [LAST_CLAIM_TIME],
          [user_1_id],
          [toWei("2000")],
          [toWei("1000")]
        )
      ).to.be.revertedWith("TokenDistributor: address already set");
    });

    // Try to set a set user and amount with address who is not owner of pool expect to be reverted
    it("try to set a set user and amount with address who is not owner of pool expect to be reverted", async () => {
      const {
        deployer,
        poolFactory,
        user_1,
        user_2,
        user_1_id,
        user_2_id,
        distributor,
        tokenDistributor,
        addressList
      } = await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);
      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        user_1
      );

      await expect(
        tokenDistributorInstance.setClaimableAmounts(
          [LAST_CLAIM_TIME],
          [user_2_id],
          [toWei(String(2_000))],
          [toWei("1000")]
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    // Try to set an amount bigger than balance of pool and expect to be reverted
    it("try to set an amount bigger than balance of pool and expect to be reverted", async () => {
      const { deployer, poolFactory, user_1, user_1_id, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);

      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      await expect(
        tokenDistributorInstance.setClaimableAmounts(
          [LAST_CLAIM_TIME],
          [user_1_id],
          [toWei("2000")],
          [toWei("1000")]
        )
      ).to.be.revertedWith(
        "TokenDistributor: total claimable amount does not match"
      );
    });

    // Try to setClaimableAmounts with correct params
    it("try to setClaimableAmounts with correct params", async () => {
      const { deployer, poolFactory, user_1, user_1_id, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);

      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      const CLAIMABLE_AMOUNT = toWei(String(50_000));

      await network.provider.send("hardhat_setBalance", [
        tokenDistributorInstance.address,
        CLAIMABLE_AMOUNT.toHexString().replace(/0x0+/, "0x"),
      ]);

      await tokenDistributorInstance.setClaimableAmounts(
        [LAST_CLAIM_TIME],
        [user_1_id],
        [CLAIMABLE_AMOUNT],
        [toWei("25000")]
      );
      expect(
        await tokenDistributorInstance.claimableAmounts(user_1_id)
      ).to.be.equal(CLAIMABLE_AMOUNT);
    });

    // Try to claim before claim startTime and expect to be reverted
    it("try to claim before claim startTime and expect to be reverted", async () => {
      const { deployer, poolFactory, user_1, user_1_id, lemmeuser, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);

      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      const CLAIMABLE_AMOUNT = toWei(String(50_000));

      await network.provider.send("hardhat_setBalance", [
        tokenDistributorInstance.address,
        CLAIMABLE_AMOUNT.toHexString().replace(/0x0+/, "0x"),
      ]);

      await tokenDistributorInstance.setClaimableAmounts(
        [LAST_CLAIM_TIME],
        [user_1_id],
        [CLAIMABLE_AMOUNT],
        [toWei("25000")]
      );

      await expect(
        tokenDistributorInstance.connect(lemmeuser).claim()
      ).to.be.revertedWith(
        "TokenDistributor: user not set before"
      );

      await expect(
        tokenDistributorInstance.connect(user_1).claim()
      ).to.be.revertedWith(
        "TokenDistributor: distribution has not started yet"
      );
    });

    // Try to claim after the end of distribution period end but before claim period end
    it("try to claim after the end of distribution period end but before claim period end", async () => {
      const { deployer, poolFactory, user_1, user_1_id, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);

      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      const CLAIMABLE_AMOUNT = toWei(String(50_000));
      const LEFT_CLAIMABLE_AMOUNT = toWei(String(25000));

      await network.provider.send("hardhat_setBalance", [
        tokenDistributorInstance.address,
        CLAIMABLE_AMOUNT.toHexString().replace(/0x0+/, "0x"),
      ]);

      await tokenDistributorInstance.setClaimableAmounts(
        [LAST_CLAIM_TIME],
        [user_1_id],
        [CLAIMABLE_AMOUNT],
        [LEFT_CLAIMABLE_AMOUNT]
      );

      await incrementBlocktimestamp(ethers, 500_000 + TWO_DAYS_IN_SECONDS * 3);

      const balanceBeforeClaim = await poolFactory.provider.getBalance(
        user_1.address
      );
      await tokenDistributorInstance.connect(user_1).claim();
      const balanceAfterClaim = await poolFactory.provider.getBalance(
        user_1.address
      );

      const deviation = findMarginOfDeviation(
        balanceBeforeClaim.add(LEFT_CLAIMABLE_AMOUNT),
        balanceAfterClaim
      );
      expect(deviation).to.be.lessThan(0.000001);
    });

    // Try to claim with a user with 0 claimable amount and expect to be reverted
    it("try to claim with a user with 0 claimable amount and expect to be reverted", async () => {
      const { deployer, poolFactory, user_1, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);

      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      await incrementBlocktimestamp(ethers, 500_000 + TWO_DAYS_IN_SECONDS);

      await expect(
        tokenDistributorInstance.connect(user_1).claim()
      ).to.be.revertedWith("TokenDistributor: no coins to claim");
    });

    // Try to claim successfully
    it("try to claim successfully", async () => {
      const { deployer, poolFactory, user_1, user_1_id, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);

      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      const CLAIMABLE_AMOUNT = toWei(String(50_000));

      await network.provider.send("hardhat_setBalance", [
        tokenDistributorInstance.address,
        CLAIMABLE_AMOUNT.toHexString().replace(/0x0+/, "0x"),
      ]);

      await tokenDistributorInstance.setClaimableAmounts(
        [LAST_CLAIM_TIME],
        [user_1_id],
        [CLAIMABLE_AMOUNT],
        [CLAIMABLE_AMOUNT.div(2)]
      );

      await incrementBlocktimestamp(ethers, 600_000);

      const user1BalanceBeforeClaim = await poolFactory.provider.getBalance(
        user_1.address
      );
      const claimTx = await tokenDistributorInstance.connect(user_1).claim();
      const { gasUsed } = await claimTx.wait();
      const ccaInTxBlock =
        await tokenDistributorInstance.calculateClaimableAmount(
          user_1_id,
          {
            blockTag: claimTx.blockNumber! - 1,
          }
        );
      const txBlock = await poolFactory.provider.getBlock(
        claimTx.blockNumber! - 1
      );
      const user1BalanceAfterClaim = await poolFactory.provider.getBalance(
        user_1.address
      );
      const expectedBalanceAfterClaim = user1BalanceBeforeClaim
        .add(ccaInTxBlock)
        .add(gasUsed.mul(claimTx.gasPrice!));

      expect(
        findMarginOfDeviation(expectedBalanceAfterClaim, user1BalanceAfterClaim)
      ).to.be.lessThan(0.003);

      const calculatedClaimableAmount = calculateClaimableAmount(
        BigNumber.from(txBlock.timestamp),
        BigNumber.from(LAST_CLAIM_TIME),
        PERIOD_LENGTH,
        CLAIMABLE_AMOUNT,
        DISTRIBUTION_RATE
      );

      expect(ccaInTxBlock).to.be.equal(calculatedClaimableAmount);
    });

    // Try to sweep before claim period end and expect to be reverted
    it("try to sweep before claim period end and expect to be reverted", async () => {
      const { deployer, poolFactory, user_1, user_1_id, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);

      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      const CLAIMABLE_AMOUNT = toWei(String(50_000));

      await network.provider.send("hardhat_setBalance", [
        tokenDistributorInstance.address,
        CLAIMABLE_AMOUNT.mul(2).toHexString().replace(/0x0+/, "0x"),
      ]);

      await tokenDistributorInstance.setClaimableAmounts(
        [LAST_CLAIM_TIME],
        [user_1_id],
        [CLAIMABLE_AMOUNT],
        [CLAIMABLE_AMOUNT.div(2)]
      );

      await incrementBlocktimestamp(ethers, 100_000_000_000);

    //   await expect(
    //     tokenDistributorInstance.connect(user_1).claim()
    //   ).to.be.revertedWith("TokenDistributor: claim period ended");
    });

    // Try to sweep after there is no funds left in the pool and expect to be reverted
    it("try to sweep after there is no funds left in the pool and expect to be reverted", async () => {
      const { deployer, poolFactory, user_1, user_1_id, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);

      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      const CLAIMABLE_AMOUNT = toWei(String(50_000));

      await network.provider.send("hardhat_setBalance", [
        tokenDistributorInstance.address,
        CLAIMABLE_AMOUNT.toHexString().replace(/0x0+/, "0x"),
      ]);

      await tokenDistributorInstance.setClaimableAmounts(
        [LAST_CLAIM_TIME],
        [user_1_id],
        [CLAIMABLE_AMOUNT],
        [CLAIMABLE_AMOUNT.div(2)]
      );

    //   await expect(
    //     tokenDistributorInstance.connect(deployer).sweep()
    //   ).to.be.revertedWith(
    //     "TokenDistributor: cannot sweep before claim period end time"
    //   );

      await incrementBlocktimestamp(
        ethers,
        500_000 + TWO_DAYS_IN_SECONDS + 86400 * 100
      );

      const poolBalance = await poolFactory.provider.getBalance(
        tokenDistributorInstance.address
      );
      const deployerBalanceBeforeSweep = await poolFactory.provider.getBalance(
        deployer.address
      );
      await tokenDistributorInstance.connect(deployer).sweep();
      const deployerBalanceAfterSweep = await poolFactory.provider.getBalance(
        deployer.address
      );
      expect(
        findMarginOfDeviation(
          deployerBalanceBeforeSweep.add(poolBalance),
          deployerBalanceAfterSweep
        )
      ).to.be.lessThan(0.00001);

      await expect(
        tokenDistributorInstance.connect(deployer).sweep()
      ).to.be.revertedWith("TokenDistributor: no leftovers");
    });

    // Try to update pool params after distribution period start and expect to be reverted
    it("try to update pool params after distribution period start and expect to be reverted", async () => {
      const { deployer, poolFactory, user_1, user_1_id, distributor, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress = await poolFactory.tokenDistributors(0);

      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      await tokenDistributorInstance
        .connect(deployer)
        .updatePoolParams(
          START_TIME + 1,
          END_TIME + 1,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH
        );

      expect(
        await tokenDistributorInstance.distributionPeriodStart()
      ).to.be.equal(START_TIME + 1);
      expect(
        await tokenDistributorInstance.distributionPeriodEnd()
      ).to.be.equal(END_TIME + 1);

      const CLAIMABLE_AMOUNT = toWei(String(50_000));

      await network.provider.send("hardhat_setBalance", [
        tokenDistributorInstance.address,
        CLAIMABLE_AMOUNT.toHexString().replace(/0x0+/, "0x"),
      ]);

      await tokenDistributorInstance.setClaimableAmounts(
        [LAST_CLAIM_TIME],
        [user_1_id],
        [CLAIMABLE_AMOUNT],
        [CLAIMABLE_AMOUNT.div(2)]
      );

      await expect(
        tokenDistributorInstance
          .connect(deployer)
          .updatePoolParams(
            START_TIME + 1,
            END_TIME + 1,
            DISTRIBUTION_RATE,
            PERIOD_LENGTH
          )
      ).to.be.revertedWith(
        "TokenDistributor: claimable amounts were set before"
      );
    });

    it("try to sweep and expect to be failed", async () => {
      const { deployer, poolFactory, distributor, deployer_id, tokenDistributor, addressList } =
        await loadFixture(initiateVariables);

      await poolFactory
        .connect(deployer)
        .initialize(distributor.address, tokenDistributor.address);

      await poolFactory
        .connect(deployer)
        .createTokenDistributor(
          POOL_NAME,
          START_TIME,
          END_TIME,
          DISTRIBUTION_RATE,
          PERIOD_LENGTH,
          addressList.address
        );

      const tokenDistributorAddress: Address =
        await poolFactory.tokenDistributors(0);

      const tokenDistributorInstance = TokenDistributor__factory.connect(
        tokenDistributorAddress,
        deployer
      );

      const CLAIMABLE_AMOUNT = toWei(String(50_000));

      // send ether to contract
      await network.provider.send("hardhat_setBalance", [
        tokenDistributorInstance.address,
        CLAIMABLE_AMOUNT.toHexString().replace(/0x0+/, "0x"),
      ]);

      await tokenDistributorInstance.setClaimableAmounts(
        [LAST_CLAIM_TIME],
        [deployer_id],
        [CLAIMABLE_AMOUNT],
        [CLAIMABLE_AMOUNT.div(2)]
      );

      // unable to test sweep method, so solved it by adding bytecode to deployer(an address has withdraw funds from contract).
      // this is the code that is embedded to deployer
      // pragma solidity 0.8.16;
      // contract Pseudo {}
      // there is no receive function, so that revert is expected due to unable to receive ethers
      await network.provider.send("hardhat_setCode", [
        deployer.address,
        "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220e8a0f1f97cf9b211b0a7515e0012fca8cf19406ce7f44e5db008a1d5c83b89ea64736f6c63430008100033",
      ]);

      await incrementBlocktimestamp(ethers, 600_000);

      await expect(
        tokenDistributorInstance.connect(deployer).claim()
      ).revertedWith("TokenDistributor: unable to claim");

      await incrementBlocktimestamp(ethers, 100_000_000_000);

      await expect(
        tokenDistributorInstance.connect(deployer).sweep()
      ).revertedWith("TokenDistributor: unable to claim");
    });
  });
});

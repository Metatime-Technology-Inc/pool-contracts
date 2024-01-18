// https://avatars.githubusercontent.com/u/88249309?v=4
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import POOL_PARAMS from "../scripts/constants/pool-params";
import {
  incrementBlocktimestamp,
  toWei,
  getBlockTimestamp,
  findMarginOfDeviation,
} from "../scripts/helpers";
import { TokenDistributorWithNoVesting, AddressList } from "../typechain-types";

const SECONDS_IN_A_DAY = 60 * 24 * 60;

describe("TokenDistributorWithNoVesting", function () {
  async function initiateVariables() {
    const [deployer, user_1, user_2, user_3, user_4, user_5, deployer_2, lemmeuser] =
      await ethers.getSigners();

    const currentBlockTimestamp = await getBlockTimestamp(ethers);
    const DISTRIBUTION_START = currentBlockTimestamp + SECONDS_IN_A_DAY * 2;
    const DISTRIBUTION_END = DISTRIBUTION_START + SECONDS_IN_A_DAY * 10;

    const TokenDistributorWithNoVesting_ = await ethers.getContractFactory(
      CONTRACTS.core.TokenDistributorWithNoVesting
    );
    const tokenDistributorWithNoVesting =
      (await TokenDistributorWithNoVesting_.connect(
        deployer
      ).deploy()) as TokenDistributorWithNoVesting;
    await tokenDistributorWithNoVesting.deployed();

    const tokenDistributorWithNoVesting_2 =
      (await TokenDistributorWithNoVesting_.connect(
        deployer_2
      ).deploy()) as TokenDistributorWithNoVesting;
    await tokenDistributorWithNoVesting_2.deployed();

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
        50
    ], [
        user_1.address,
        user_2.address,
        user_3.address,
        user_4.address,
        user_5.address
    ]);

    return {
      tokenDistributorWithNoVesting,
      addressList,
      tokenDistributorWithNoVesting_2,
      deployer,
      deployer_2,
      lemmeuser,
      user_1,
      user_2,
      user_3,
      user_4,
      user_5,
      user_1_id: 10,
      user_2_id: 20,
      user_3_id: 30,
      user_4_id: 40,
      user_5_id: 50,
      DISTRIBUTION_START,
      DISTRIBUTION_END,
    };
  }

  describe("Create TokenDistributorWithNoVesting & test claim period", async () => {
    it("add user to address list", async () => {
        const { user_1_id, user_1, deployer, addressList } = await loadFixture(initiateVariables);

        const lemmeaddress = "0x0000000000000000000000000000000000000222";
        const lemmeid = 123123;

        await addressList.connect(deployer).setWalletAddress(lemmeid, lemmeaddress);

        await expect(
            addressList.connect(deployer).setWalletAddress(user_1_id, user_1.address)
        ).to.be.revertedWith("AddressList: userID already issued");

        const userIds = [(user_1_id + 1), (user_1_id + 2)];
        const wallets = ["0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000002"];

        await addressList.connect(deployer).setWalletAddresses(userIds, wallets);

        await expect(
            addressList.connect(deployer).setWalletAddresses([user_1_id], wallets)
        ).to.be.revertedWith("AddressList: Provided data incorrect");

        await expect(
            addressList.connect(deployer).setWalletAddresses([0, user_1_id], wallets)
        ).to.be.revertedWith("AddressList: address already issued");
        await expect(
            addressList.connect(deployer).setWalletAddresses([0, user_1_id], ["0x0000000000000000000000000000000000000008", "0x0000000000000000000000000000000000000009"])
        ).to.be.revertedWith("AddressList: Cant set to id 0");

        await expect(
            addressList.connect(deployer).setWalletAddresses([3, 4], ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000003"])
        ).to.be.revertedWith("AddressList: Cant set zero address");
    });

    // try to receive eth
    it("try to receive eth", async () => {
      const { deployer, tokenDistributorWithNoVesting } = await loadFixture(
        initiateVariables
      );

      const SENT_AMOUNT = toWei(String(1_000));

      await expect(
        deployer.sendTransaction({
          to: tokenDistributorWithNoVesting.address,
          value: SENT_AMOUNT,
        })
      )
        .to.emit(tokenDistributorWithNoVesting, "Deposit")
        .withArgs(deployer.address, SENT_AMOUNT, SENT_AMOUNT);
    });

    it("should initiate pool & test claim period", async function () {
      const {
        tokenDistributorWithNoVesting,
        addressList,
        deployer,
        user_1,
        user_2,
        user_3,
        user_4,
        user_5,
        user_1_id,
        user_2_id,
        user_3_id,
        user_4_id,
        user_5_id,
        lemmeuser,
        DISTRIBUTION_START,
        DISTRIBUTION_END,
      } = await loadFixture(initiateVariables);

      await tokenDistributorWithNoVesting
        .connect(deployer)
        .initialize(DISTRIBUTION_START, addressList.address);

      // Set addresses and their amounts with no balance and expect revert
      const addrs = [
        user_1_id,
        user_2_id,
        user_3_id,
        user_4_id,
      ];
      const amounts = [
        toWei(String(10_000_000)),
        toWei(String(25_000_000)),
        toWei(String(60_000_000)),
        toWei(String(5_000_000)),
      ];

      await expect(
        tokenDistributorWithNoVesting
          .connect(deployer)
          .setClaimableAmounts(addrs, amounts)
      ).to.be.revertedWith(
        "TokenDistributorWithNoVesting: total claimable amount does not match"
      );

      // Send funds and try to set addresses and their amounts
      await network.provider.send("hardhat_setBalance", [
        tokenDistributorWithNoVesting.address,
        POOL_PARAMS.PRIVATE_SALE_POOL.lockedAmount
          .toHexString()
          .replace(/0x0+/, "0x"),
      ]);

      await tokenDistributorWithNoVesting
        .connect(deployer)
        .setClaimableAmounts(addrs, amounts);

      // try send mismatched length of address and amount list and expect to be reverted
      await expect(
        tokenDistributorWithNoVesting
          .connect(deployer)
          .setClaimableAmounts([addrs[0]], amounts)
      ).to.be.revertedWith(
        "TokenDistributorWithNoVesting: user and amount list lengths must match"
      );

      // try to set address again
      await expect(
        tokenDistributorWithNoVesting
          .connect(deployer)
          .setClaimableAmounts([addrs[0]], [amounts[0]])
      ).to.be.revertedWith(
        "TokenDistributorWithNoVesting: address already set"
      );

      // try to set 0x address and expect to be reverted
      await expect(
        tokenDistributorWithNoVesting
          .connect(deployer)
          .setClaimableAmounts(
            [ethers.constants.AddressZero],
            [toWei(String(1_000))]
          )
      ).to.be.revertedWith(
        "TokenDistributorWithNoVesting: cannot set zero"
      );

      const user_1ClaimableAmounts =
        await tokenDistributorWithNoVesting.claimableAmounts(user_1_id);
      const user_2ClaimableAmounts =
        await tokenDistributorWithNoVesting.claimableAmounts(user_2_id);
      const user_3ClaimableAmounts =
        await tokenDistributorWithNoVesting.claimableAmounts(user_3_id);
      const user_4ClaimableAmounts =
        await tokenDistributorWithNoVesting.claimableAmounts(user_4_id);

      expect(user_1ClaimableAmounts).to.be.equal(toWei(String(10_000_000)));
      expect(user_2ClaimableAmounts).to.be.equal(toWei(String(25_000_000)));
      expect(user_3ClaimableAmounts).to.be.equal(toWei(String(60_000_000)));
      expect(user_4ClaimableAmounts).to.be.equal(toWei(String(5_000_000)));
      

      // Try to claim before distribution start time
      await expect(
        tokenDistributorWithNoVesting.connect(user_1).claim()
      ).to.be.revertedWith(
        "TokenDistributorWithNoVesting: coins cannot be claimed yet"
      );

      // Try to set addresses and their amounts after claim started and expect revert
      await incrementBlocktimestamp(ethers, SECONDS_IN_A_DAY * 3);
      await expect(
        tokenDistributorWithNoVesting
          .connect(deployer)
          .setClaimableAmounts([user_5.address], [toWei(String(1_000_000))])
      ).to.be.revertedWith(
        "TokenDistributorWithNoVesting: claim period has already started"
      );

      // Try to claim coins with wrong address
      await expect(
        tokenDistributorWithNoVesting.connect(user_5).claim()
      ).to.be.revertedWith("TokenDistributorWithNoVesting: no coins to claim");

      const user1BalanceBeforeClaim =
        await tokenDistributorWithNoVesting.provider.getBalance(user_1.address);
      const user2BalanceClaimTxBeforeClaim =
        await tokenDistributorWithNoVesting.provider.getBalance(user_2.address);
      const user3BalanceClaimTxBeforeClaim =
        await tokenDistributorWithNoVesting.provider.getBalance(user_3.address);

      // Try to claim coins with true addresses
      await network.provider.send("hardhat_setCode", [
        user_4.address,
        "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220e8a0f1f97cf9b211b0a7515e0012fca8cf19406ce7f44e5db008a1d5c83b89ea64736f6c63430008100033",
      ]);

      await expect(
        tokenDistributorWithNoVesting.connect(user_4).claim()
      ).revertedWith("TokenDistributorWithNoVesting: unable to withdraw");

      await tokenDistributorWithNoVesting.connect(user_1).claim();
      await tokenDistributorWithNoVesting.connect(user_2).claim();
      await tokenDistributorWithNoVesting.connect(user_3).claim();

      await expect(
        tokenDistributorWithNoVesting.connect(lemmeuser).claim()
      ).to.be.revertedWith(
        "TokenDistributor: user not set before"
      );

      const user1BalanceClaimTxAfterClaim =
        await tokenDistributorWithNoVesting.provider.getBalance(user_1.address);
      const user2BalanceClaimTxAfterClaim =
        await tokenDistributorWithNoVesting.provider.getBalance(user_2.address);
      const user3BalanceClaimTxAfterClaim =
        await tokenDistributorWithNoVesting.provider.getBalance(user_3.address);

      expect(
        findMarginOfDeviation(
          user1BalanceBeforeClaim.add(toWei(String(10_000_000))),
          user1BalanceClaimTxAfterClaim
        )
      ).to.be.lessThan(0.000001);
      expect(
        findMarginOfDeviation(
          user2BalanceClaimTxBeforeClaim.add(toWei(String(25_000_000))),
          user2BalanceClaimTxAfterClaim
        )
      ).to.be.lessThan(0.000001);
      expect(
        findMarginOfDeviation(
          user3BalanceClaimTxBeforeClaim.add(toWei(String(60_000_000))),
          user3BalanceClaimTxAfterClaim
        )
      ).to.be.lessThan(0.000001);

    //   // try to sweep before claim period end
    //   await expect(
    //     tokenDistributorWithNoVesting.connect(deployer).sweep()
    //   ).to.be.revertedWith(
    //     "TokenDistributorWithNoVesting: cannot sweep before claim end time"
    //   );

      // try to claim after claim period end
      await incrementBlocktimestamp(
        ethers,
        SECONDS_IN_A_DAY * 1000 + DISTRIBUTION_END
      );
      await expect(
        tokenDistributorWithNoVesting.connect(user_4).claim()
      ).to.be.revertedWith(
        "TokenDistributorWithNoVesting: unable to withdraw"
      );

      // try to sweep after claim period end
      await tokenDistributorWithNoVesting.connect(deployer).sweep();

      // try to sweep again
      await expect(
        tokenDistributorWithNoVesting.connect(deployer).sweep()
      ).to.be.revertedWith("TokenDistributorWithNoVesting: no leftovers");
    });

    it("try to sweep and expect to be failed", async () => {
      const {
        deployer_2,
        tokenDistributorWithNoVesting_2,
        DISTRIBUTION_START,
        DISTRIBUTION_END,
        addressList
      } = await loadFixture(initiateVariables);

      await tokenDistributorWithNoVesting_2
        .connect(deployer_2)
        .initialize(DISTRIBUTION_START, addressList.address);

      const CLAIMABLE_AMOUNT = toWei(String(50_000));

      // send ether to contract
      await network.provider.send("hardhat_setBalance", [
        tokenDistributorWithNoVesting_2.address,
        CLAIMABLE_AMOUNT.toHexString().replace(/0x0+/, "0x"),
      ]);

      // unable to test sweep method, so solved it by adding bytecode to deployer(an address has withdraw funds from contract).
      // this is the code that is embedded to deployer
      // pragma solidity 0.8.16;
      // contract Pseudo {}
      // there is no receive function, so that revert is expected due to unable to receive ethers
      await network.provider.send("hardhat_setCode", [
        deployer_2.address,
        "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220e8a0f1f97cf9b211b0a7515e0012fca8cf19406ce7f44e5db008a1d5c83b89ea64736f6c63430008100033",
      ]);

      await incrementBlocktimestamp(ethers, DISTRIBUTION_START + (SECONDS_IN_A_DAY * 100));

      await expect(
        tokenDistributorWithNoVesting_2.connect(deployer_2).sweep()
      ).revertedWith("TokenDistributorWithNoVesting: unable to withdraw");
    });
  });
});

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { CONTRACTS } from "../scripts/constants";
import { findMarginOfDeviation, toWei } from "../scripts/helpers";
import { BigNumber } from "ethers";
import { LiquidityPool } from "../typechain-types";

describe("LiquidityPool", function () {
  async function initiateVariables() {
    const [deployer, randomUser] = await ethers.getSigners();

    const LiquidityPool = await ethers.getContractFactory(
      CONTRACTS.core.LiquidityPool
    );
    const liquidityPool = (await LiquidityPool.connect(
      deployer
    ).deploy()) as LiquidityPool;
    await liquidityPool.deployed();

    return {
      liquidityPool,
      deployer,
      randomUser,
    };
  }

  describe("Create liquidity pool", async () => {
    it("should init twice and expect to be reverted", async () => {
      const { liquidityPool, deployer } = await loadFixture(initiateVariables);

      await liquidityPool.connect(deployer).initialize();

      await expect(liquidityPool.connect(deployer).initialize()).revertedWith(
        "Initializable: contract is already initialized"
      );
    });

    it("should initiate liquidity pool & transfer funds", async function () {
      const { liquidityPool, deployer, randomUser } = await loadFixture(
        initiateVariables
      );

      const SENT_AMOUNT: BigNumber = toWei(String(10_000));

      // test transfer funds when no balance in pool
      await expect(
        liquidityPool.connect(deployer).transferFunds(toWei(String(1_000_000)))
      ).to.be.revertedWith("LiquidityPool: no mtc to withdraw");

      await network.provider.send("hardhat_setBalance", [
        deployer.address,
        toWei(String(100_000)).toHexString(),
      ]);

      await expect(
        deployer.sendTransaction({
          to: liquidityPool.address,
          value: SENT_AMOUNT,
        })
      )
        .to.emit(liquidityPool, "Deposit")
        .withArgs(deployer.address, SENT_AMOUNT, SENT_AMOUNT);

      // try to transfer funds with address thats not owner of the contract
      await expect(
        liquidityPool.connect(randomUser).transferFunds(toWei(String(1_000)))
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // try to transfer funds
      const ownerBalanceBeforeTransfer =
        await liquidityPool.provider.getBalance(deployer.address);
      await liquidityPool.connect(deployer).transferFunds(toWei(String(1_000)));
      const ownerBalanceAfterTransfer = await liquidityPool.provider.getBalance(
        deployer.address
      );
      const deviation = findMarginOfDeviation(
        BigNumber.from(ownerBalanceBeforeTransfer).add(toWei(String(1_000))),
        ownerBalanceAfterTransfer
      );
      expect(deviation).to.be.lessThan(0.00001);
    });
  });

  it("try to test internal _withdraw function", async () => {
    const { deployer, liquidityPool } = await loadFixture(initiateVariables);

    await network.provider.send("hardhat_setBalance", [
      liquidityPool.address,
      toWei(String(100_000)).toHexString(),
    ]);

    // unable to test internal _withdraw method, so solved it by adding bytecode to deployer(an address has withdraw funds from contract).
    // this is the code that is embedded to deployer
    // pragma solidity 0.8.16;
    // contract Pseudo {}
    // there is no receive function, so that revert is expected due to unable to receive ethers
    await network.provider.send("hardhat_setCode", [
      deployer.address,
      "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220e8a0f1f97cf9b211b0a7515e0012fca8cf19406ce7f44e5db008a1d5c83b89ea64736f6c63430008100033",
    ]);

    await expect(
      liquidityPool.connect(deployer).transferFunds(toWei(String(100)))
    ).revertedWith("LiquidityPool: unable to withdraw");
  });
});

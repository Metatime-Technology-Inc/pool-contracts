import { BigNumber, ethers } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";

type Entry<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T];

function filterObject<T extends object>(
  obj: T,
  fn: (entry: Entry<T>, i: number, arr: Entry<T>[]) => boolean
) {
  return Object.fromEntries(
    (Object.entries(obj) as Entry<T>[]).filter(fn)
  ) as Partial<T>;
}

const getBlockTimestamp = async (
  ethers: HardhatEthersHelpers
): Promise<number> => {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  return blockBefore.timestamp;
};

const toWei = (amount: string): ethers.BigNumber => {
  return ethers.utils.parseEther(amount);
};

const callMethod = async (
  contract: ethers.Contract,
  signer: SignerWithAddress,
  methodName: string,
  params: any[],
  value?: BigNumber
): Promise<any> => {
  if (value) {
    params.push({ value });
  }

  return await contract.connect(signer)[methodName].apply(null, params);
};

const incrementBlocktimestamp = async (
  ethers: HardhatEthersHelpers,
  givenTimeAmount: number
): Promise<void> => {
  await ethers.provider.send("evm_increaseTime", [givenTimeAmount]);
  await ethers.provider.send("evm_mine", []);
};

const calculateExchangeFee = (amount: number, percentage: number) => {
  return (amount * percentage) / 100;
};

const calculateClaimableAmount = (blockTimestamp: BigNumber, lastClaimTimestamp: BigNumber, periodLength: number, claimableAmount: BigNumber, distributionRate: number) => {
  const decimals = BigNumber.from(10).pow(18);
  const periodSinceLastClaim = ((blockTimestamp.sub(lastClaimTimestamp)).mul(decimals)).div(periodLength);
  return ((claimableAmount.mul(distributionRate)).mul(periodSinceLastClaim)).div(10_000).div(decimals);
};

export {
  getBlockTimestamp,
  toWei,
  callMethod,
  calculateExchangeFee,
  incrementBlocktimestamp,
  filterObject,
  calculateClaimableAmount
};

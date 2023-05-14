import { BigNumber } from "ethers";
import { toWei } from "../helpers";

interface IConstructorParams {
    MTC: {
        totalSupply: BigNumber;
        pools: [{ name: string, addr: (poolAddress: string) => string, lockedAmount: BigNumber; }];
    },
    RoyaltyFeeManager: {
        MAXIMUM_FEE_PERCENTAGE: number;
    };
}

const CONSTRUCTOR_PARAMS: IConstructorParams = {
    MTC: {
        totalSupply: toWei(String(10_000_000_000 * 10 ** 18)),
        pools: [
            {
                name: "Seed Sale 1",
                addr: (poolAddress: string): string => poolAddress,
                lockedAmount: toWei(String(100_000_000)),
            },
            {
                name: "Seed Sale 2",
                addr: (poolAddress: string): string => poolAddress,
                lockedAmount: toWei(String(100_000_000)),
            }
        ]
    },
    RoyaltyFeeManager: {
        MAXIMUM_FEE_PERCENTAGE: 20
    }
};

export default CONSTRUCTOR_PARAMS;
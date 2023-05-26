import { BigNumber } from "ethers";
import { toWei } from "../helpers";

interface IConstructorParams {
    MTC: {
        totalSupply: BigNumber;
    },
    RoyaltyFeeManager: {
        MAXIMUM_FEE_PERCENTAGE: number;
    };
}

const CONSTRUCTOR_PARAMS: IConstructorParams = {
    MTC: {
        totalSupply: toWei(String(10_000_000_000)),
    },
    RoyaltyFeeManager: {
        MAXIMUM_FEE_PERCENTAGE: 20
    }
};

export default CONSTRUCTOR_PARAMS;
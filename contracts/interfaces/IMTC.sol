// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IMTC
 * @dev Interface for the MTC (My Token Coin) token contract
 */
interface IMTC is IERC20 {
    /**
     * @dev Burns a specific amount of tokens.
     * @param amount The amount of tokens to be burned.
     */
    function burn(uint256 amount) external;
}

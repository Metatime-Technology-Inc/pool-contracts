// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LiquidityPool
 * @dev A contract for managing a liquidity pool.
 */
contract LiquidityPool is Ownable2Step {
    IERC20 public immutable token; // Token used in the liquidity pool

    event Withdrew(uint256 amount); // Event emitted when tokens are withdrawn from the pool

    /**
     * @dev Constructor.
     * @param _token The token used in the liquidity pool
     */
    constructor(IERC20 _token) {
        require(
            address(_token) != address(0),
            "LiquidityPool: invalid token address"
        );

        token = _token;
    }

    /**
     * @dev Transfers funds from the liquidity pool to the specified address.
     * @param withdrawalAmount The amount of tokens to withdraw from the pool
     */
    function transferFunds(uint256 withdrawalAmount) external onlyOwner {
        _withdraw(owner(), withdrawalAmount);

        emit Withdrew(withdrawalAmount);
    }

    /**
     * @dev Internal function to withdraw tokens from the pool.
     * @param _to The address to which the tokens will be transferred
     * @param _withdrawalAmount The amount of tokens to withdraw
     * @return A boolean indicating whether the withdrawal was successful
     */
    function _withdraw(
        address _to,
        uint256 _withdrawalAmount
    ) internal returns (bool) {
        uint256 poolBalance = token.balanceOf(address(this));
        require(
            poolBalance > 0 && _withdrawalAmount <= poolBalance,
            "LiquidityPool: no tokens to withdraw"
        );

        SafeERC20.safeTransfer(token, _to, _withdrawalAmount);

        return true;
    }
}

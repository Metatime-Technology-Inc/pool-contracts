// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LiquidityPool is Ownable2Step {
    IERC20 public token;

    event Withdrew(uint256 amount);

    constructor(IERC20 _token) {
        _transferOwnership(_msgSender());

        token = _token;
    }

    function transferFunds(uint256 withdrawalAmount) onlyOwner external {
        _withdraw(owner(), withdrawalAmount);

        emit Withdrew(withdrawalAmount);
    }

    function _withdraw(address _to, uint256 _withdrawalAmount) internal returns(bool) {
        uint256 poolBalance = token.balanceOf(address(this));
        require(poolBalance > 0 && _withdrawalAmount <= poolBalance, "No tokens to withdraw!");

        SafeERC20.safeTransfer(token, _to, _withdrawalAmount);

        return true;
    }
}
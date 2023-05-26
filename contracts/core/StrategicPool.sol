// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "../libs/Trigonometry.sol";

contract StrategicPool is Ownable2Step, ReentrancyGuard {
    ERC20Burnable public token;
    int256 public totalBurnedAmount = 0;
    int256 public constant constantValueFromFormula = 1000;

    event Withdrew(uint256 amount);
    event Burned(uint256 amount, bool withFormula);

    constructor(ERC20Burnable _token) {
        _transferOwnership(_msgSender());

        token = _token;
    }

    function withdraw(uint256 withdrawalAmount) onlyOwner external {
        _transfer(owner(), withdrawalAmount);

        emit Withdrew(withdrawalAmount);
    }

    function burnWithFormula(int256 currentPrice, int256 blocksInTwoMonths) onlyOwner nonReentrant external {
        uint256 amount = uint256(calculateBurnAmount(currentPrice, blocksInTwoMonths));

        require(amount > 0, "burnWithFormula: Amount is too less!");

        token.burn(amount);

        totalBurnedAmount += int256(amount);

        emit Burned(amount, true);
    }

    function burn(uint256 burnAmount) onlyOwner nonReentrant external {
        token.burn(burnAmount);

        totalBurnedAmount += int256(burnAmount);

        emit Burned(burnAmount, false);
    }

    function calculateBurnAmount(int256 _currentPrice, int256 _blocksInTwoMonths) public view returns(int256) {
        return (((_blocksInTwoMonths * 13 * 1e4 * 1e18) / ((100 * _currentPrice * 1e16) + (constantValueFromFormula * 1e18))) 
            * Trigonometry.cos(uint256((((86 * 1e18) + (totalBurnedAmount * 1e9)) * 3141592653589793238) / (180 * 1e18))) * 2923 * 1e15) / 1e18;
    }

    function _transfer(address _to, uint256 _withdrawalAmount) internal returns(bool) {
        uint256 poolBalance = token.balanceOf(address(this));
        require(poolBalance > 0 && _withdrawalAmount <= poolBalance, "No tokens to withdraw!");

        SafeERC20.safeTransfer(token, _to, _withdrawalAmount);

        return true;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "../libs/Trigonometry.sol";

/**
 * @title StrategicPool
 * @dev A contract for managing a strategic pool of tokens.
 */
contract StrategicPool is Ownable2Step, ReentrancyGuard {
    ERC20Burnable public token;  // The token managed by the pool
    int256 public totalBurnedAmount = 0;  // The total amount of tokens burned from the pool
    int256 public constant constantValueFromFormula = 1000;  // A constant value used in the formula

    event Withdrew(uint256 amount);  // Event emitted when tokens are withdrawn from the pool
    event Burned(uint256 amount, bool withFormula);  // Event emitted when tokens are burned from the pool

    constructor(ERC20Burnable _token) {
        _transferOwnership(_msgSender());

        token = _token;
    }

    /**
     * @dev Withdraws tokens from the pool and transfers them to the owner.
     * @param withdrawalAmount The amount of tokens to withdraw
     */
    function withdraw(uint256 withdrawalAmount) onlyOwner external {
        _transfer(owner(), withdrawalAmount);

        emit Withdrew(withdrawalAmount);
    }

    /**
     * @dev Burns tokens from the pool using a formula.
     * @param currentPrice The current price used in the burn formula
     * @param blocksInTwoMonths The number of blocks in two months used in the burn formula
     */
    function burnWithFormula(int256 currentPrice, int256 blocksInTwoMonths) onlyOwner nonReentrant external {
        uint256 amount = uint256(calculateBurnAmount(currentPrice, blocksInTwoMonths));

        require(amount > 0, "burnWithFormula: Amount is too less!");

        token.burn(amount);

        totalBurnedAmount += int256(amount);

        emit Burned(amount, true);
    }

    /**
     * @dev Burns tokens from the pool without using a formula.
     * @param burnAmount The amount of tokens to burn
     */
    function burn(uint256 burnAmount) onlyOwner nonReentrant external {
        token.burn(burnAmount);

        totalBurnedAmount += int256(burnAmount);

        emit Burned(burnAmount, false);
    }

    /**
     * @dev Calculates the amount of tokens to burn using a formula.
     * @param _currentPrice The current price used in the burn formula
     * @param _blocksInTwoMonths The number of blocks in two months used in the burn formula
     * @return The amount of tokens to burn
     */
    function calculateBurnAmount(int256 _currentPrice, int256 _blocksInTwoMonths) public view returns(int256) {
        return (((_blocksInTwoMonths * 13 * 1e4 * 1e18) / ((100 * _currentPrice * 1e16) + (constantValueFromFormula * 1e18))) 
            * Trigonometry.cos(uint256((((86 * 1e18) + (totalBurnedAmount * 1e9)) * 3141592653589793238) / (180 * 1e18))) * 2923 * 1e15) / 1e18;
    }

    /**
     * @dev Internal function to transfer tokens from the pool to a specified address.
     * @param _to The address to transfer tokens to
     * @param _withdrawalAmount The amount of tokens to transfer
     * @return A boolean indicating whether the transfer was successful
    */
    function _transfer(address _to, uint256 _withdrawalAmount) internal returns(bool) {
        uint256 poolBalance = token.balanceOf(address(this));
        require(poolBalance > 0 && _withdrawalAmount <= poolBalance, "No tokens to withdraw!");

        SafeERC20.safeTransfer(token, _to, _withdrawalAmount);

        return true;
    }
}
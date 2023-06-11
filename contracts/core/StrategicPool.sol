// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "../interfaces/IMTC.sol";
import "../libs/Trigonometry.sol";

/**
 * @title StrategicPool
 * @dev A contract for managing a strategic pool of tokens.
 */
contract StrategicPool is Ownable2Step, ReentrancyGuard {
    IMTC public immutable token; // The token managed by the pool
    int256 public totalBurnedAmount = 0; // The total amount of tokens burned from the pool
    int256 public constant constantValueFromFormula = 1000; // A constant value used in the formula

    event Burned(uint256 amount, bool withFormula); // Event emitted when tokens are burned from the pool

    /**
     * Constructor
     * @param _token The token being burned
     */
    constructor(IMTC _token) {
        require(address(_token) != address(0), "StrategicPool: invalid token address");

        token = _token;
    }

    /**
     * @dev Burns tokens from the pool using a formula.
     * @param currentPrice The current price used in the burn formula
     * @param blocksInTwoMonths The number of blocks in two months used in the burn formula
     */
    function burnWithFormula(
        int256 currentPrice,
        int256 blocksInTwoMonths
    ) external onlyOwner nonReentrant {
        uint256 amount = uint256(
            calculateBurnAmount(currentPrice, blocksInTwoMonths)
        );

        require(amount > 0, "burnWithFormula: Amount is too less!");

        totalBurnedAmount += int256(amount);

        token.burn(amount);

        emit Burned(amount, true);
    }

    /**
     * @dev Burns tokens from the pool without using a formula.
     * @param burnAmount The amount of tokens to burn
     */
    function burn(uint256 burnAmount) external onlyOwner nonReentrant {
        totalBurnedAmount += int256(burnAmount);

        token.burn(burnAmount);

        emit Burned(burnAmount, false);
    }

    /**
     * @dev Calculates the amount of tokens to burn using a formula.
     * @param _currentPrice The current price used in the burn formula
     * @param _blocksInTwoMonths The number of blocks in two months used in the burn formula
     * @return The amount of tokens to burn
     */
    function calculateBurnAmount(
        int256 _currentPrice,
        int256 _blocksInTwoMonths
    ) public view returns (int256) {
        return
            (((_blocksInTwoMonths * 13 * 1e4 * 1e18) /
                ((100 * _currentPrice * 1e16) +
                    (constantValueFromFormula * 1e18))) *
                Trigonometry.cos(
                    uint256(
                        (((86 * 1e18) + (totalBurnedAmount * 1e9)) *
                            3141592653589793238) / (180 * 1e18)
                    )
                ) *
                2923 *
                1e15) / 1e18;
    }
}

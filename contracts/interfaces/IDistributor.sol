// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IDistributor
 * @dev Interface for a token distributor contract
 */
interface IDistributor {
    /**
     * @dev Initializes the token distributor contract with the provided parameters.
     * @param _owner The address of the contract owner
     * @param _poolName The name of the token distribution pool
     * @param _token The address of the token being distributed
     * @param _startTime The start timestamp of the distribution period
     * @param _endTime The end timestamp of the distribution period
     * @param _distributionRate The rate at which tokens are distributed per claim
     * @param _periodLength The duration of each distribution period
     * @param _claimableAmount The total amount of tokens available for distribution
     */
    function initialize(
        address _owner,
        string memory _poolName,
        address _token,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _distributionRate,
        uint256 _periodLength,
        uint256 _claimableAmount
    ) external;
}

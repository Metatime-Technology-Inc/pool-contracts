// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "../core/AirdropDistributor.sol";
import "../core/AirdropVestingDistributor.sol";
import "../interfaces/IAirdropDistributor.sol";
import "../interfaces/IAirdropVestingDistributor.sol";

/**
 * @title AirdropFactory
 * @dev A contract for creating AirdropDistributor and AirdropVestingDistributor contracts.
 */
contract AirdropFactory is Ownable2Step {
    uint256 public distributorCount; // Counter for the number of created AirdropDistributor contracts.
    uint256 public vestingDistributorCount; // Counter for the number of created AirdropVestingDistributor contracts.

    mapping(uint256 => address) private _distributors; // Mapping to store AirdropDistributor contract addresses by their IDs.
    mapping(uint256 => address) private _vestingDistributors; // Mapping to store AirdropVestingDistributor contract addresses by their IDs.

    address public immutable distributorImplementation; // Address of the implementation contract for AirdropDistributor contracts.
    address public immutable vestingDistributorImplementation; // Address of the implementation contract for AirdropVestingDistributor contracts.

    event DistributorCreated(
        address creatorAddress,
        address distributorAddress,
        uint256 distributorId
    ); // Event emitted when a AirdropDistributor contract is created.
    event VestingDistributorCreated(
        address creatorAddress,
        address tokenDistributorAddress,
        uint256 tokenDistributorId
    ); // Event emitted when a AirdropVestingDistributor contract is created.

    constructor() {
        distributorImplementation = address(new AirdropDistributor());
        vestingDistributorImplementation = address(new AirdropVestingDistributor());
    }

    /**
     * @dev Returns the address of a AirdropDistributor contract based on the airdropDistributor ID.
     * @param distributorId The ID of the AirdropDistributor contract.
     * @return The address of the AirdropDistributor contract.
     */
    function getDistributor(
        uint256 distributorId
    ) external view returns (address) {
        return _distributors[distributorId];
    }

    /**
     * @dev Returns the address of a AirdropVestingDistributor contract based on the airdropVestingDistributor ID.
     * @param vestingDistributorId The ID of the AirdropVestingDistributor contract.
     * @return The address of the AirdropVestingDistributor contract.
     */
    function getVestingDistributor(
        uint256 vestingDistributorId
    ) external view returns (address) {
        return _vestingDistributors[vestingDistributorId];
    }

    /**
     * @dev Creates a new AirdropDistributor contract.
     * @param poolName The name of the pool.
     * @param startTime The start time of the distribution.
     * @param endTime The end time of the distribution.
     * @param addressList The AddressList contract address.
     * @return The ID of the created AirdropDistributor contract.
     */
    function createDistributor(
        string memory poolName,
        uint256 startTime,
        uint256 endTime,
        address addressList
    ) external onlyOwner returns (uint256) {
        address newDistributorAddress = Clones.clone(distributorImplementation);
        IAirdropDistributor newDistributor = IAirdropDistributor(newDistributorAddress);
        newDistributor.initialize(
            owner(),
            poolName,
            startTime,
            endTime,
            addressList
        );

        emit DistributorCreated(
            owner(),
            newDistributorAddress,
            distributorCount
        );

        return _addNewDistributor(newDistributorAddress);
    }

    /**
     * @dev Creates a new AirdropVestingDistributor contract.
     * @param poolName The name of the pool.
     * @param startTime The start time of the distribution.
     * @param endTime The end time of the distribution.
     * @param distributionRate The distribution rate.
     * @param periodLength The length of each distribution period.
     * @param addressList The AddressList contract address.
     * @return The ID of the created AirdropVestingDistributor contract.
     */
    function createTokenDistributor(
        string memory poolName,
        uint256 startTime,
        uint256 endTime,
        uint256 distributionRate,
        uint256 periodLength,
        address addressList
    ) external onlyOwner returns (uint256) {
        require(token != address(0), "PoolFactory: invalid token address");

        address newVestingDistributorAddress = Clones.clone(
            tokenDistributorImplementation
        );
        IAirdropVestingDistributor newTokenDistributor = IAirdropVestingDistributor(
            newVestingDistributorAddress
        );
        newTokenDistributor.initialize(
            owner(),
            poolName,
            startTime,
            endTime,
            distributionRate,
            periodLength,
            addressList
        );

        emit VestingDistributorCreated(
            owner(),
            newVestingDistributorAddress,
            vestingDistributorCount
        );

        return _addNewVestingDistributor(newVestingDistributorAddress);
    }

    /**
     * @dev Internal function to add a new AirdropDistributor contract address to the mapping.
     * @param _newDistributorAddress The address of the new AirdropDistributor contract.
     * @return The ID of the added AirdropDistributor contract.
     */
    function _addNewDistributor(
        address _newDistributorAddress
    ) internal returns (uint256) {
        _distributors[distributorCount] = _newDistributorAddress;
        distributorCount++;

        return distributorCount - 1;
    }

    /**
     * @dev Internal function to add a new AirdropVestingDistributor contract address to the mapping.
     * @param _newVestingDistributorAddress The address of the new AirdropVestingDistributor contract.
     * @return The ID of the added AirdropVestingDistributor contract.
     */
    function _addNewVestingDistributor(
        address _newVestingDistributorAddress
    ) internal returns (uint256) {
        _vestingDistributors[vestingDistributorCount] = _newVestingDistributorAddress;
        vestingDistributorCount++;

        return vestingDistributorCount - 1;
    }
}

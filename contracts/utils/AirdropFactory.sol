// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "../core/AirdropDistributor.sol";
import "../core/AirdropDistributorWithVesting.sol";
import "../interfaces/IAirdropDistributor.sol";
import "../interfaces/IAirdropDistributorWithVesting.sol";

/**
 * @title AirdropFactory
 * @dev A contract for creating AirdropDistributor and AirdropDistributorWithVesting contracts.
 */
contract AirdropFactory is Ownable2Step {
    uint256 public airdropDistributorCount; // Counter for the number of created AirdropDistributor contracts.
    uint256 public airdropDistributorWithVestingCount; // Counter for the number of created AirdropDistributorWithVesting contracts.

    mapping(uint256 => address) public airdropDistributors; // Mapping to store AirdropDistributor contract addresses by their IDs.
    mapping(uint256 => address) public airdropDistributorWithVestings; // Mapping to store AirdropDistributorWithVesting contract addresses by their IDs.

    address public immutable airdropDistributorImplementation; // Address of the implementation contract for AirdropDistributor contracts.
    address public immutable airdropDistributorWithVestingImplementation; // Address of the implementation contract for AirdropDistributorWithVesting contracts.

    event AirdropDistributorCreated(
        address creatorAddress,
        address airdropDistributorAddress,
        uint256 airdropDistributorId
    ); // Event emitted when a AirdropDistributor contract is created.
    event AirdropDistributorWithVestingCreated(
        address creatorAddress,
        address airdropDistributorWithVestingAddress,
        uint256 airdropDistributorWithVestingId
    ); // Event emitted when a AirdropDistributorWithVesting contract is created.

    constructor() {
        airdropDistributorImplementation = address(new AirdropDistributor());
        airdropDistributorWithVestingImplementation = address(
            new AirdropDistributorWithVesting()
        );
    }

    /**
     * @dev Creates a new AirdropDistributor contract.
     * @param airdropName The name of the pool.
     * @param startTime The start time of the distribution.
     * @param endTime The end time of the distribution.
     * @param addressList The AddressList contract address.
     * @return The ID of the created AirdropDistributor contract.
     */
    function createAirdropDistributor(
        string memory airdropName,
        uint256 startTime,
        uint256 endTime,
        address addressList
    ) external onlyOwner returns (uint256) {
        address newAirdropDistributorAddress = Clones.clone(
            airdropDistributorImplementation
        );
        IAirdropDistributor newAirdropDistributor = IAirdropDistributor(
            newAirdropDistributorAddress
        );
        newAirdropDistributor.initialize(
            owner(),
            airdropName,
            startTime,
            endTime,
            addressList
        );

        emit AirdropDistributorCreated(
            owner(),
            newAirdropDistributorAddress,
            airdropDistributorCount
        );

        return _addNewAirdropDistributor(newAirdropDistributorAddress);
    }

    /**
     * @dev Creates a new AirdropDistributorWithVesting contract.
     * @param airdropName The name of the pool.
     * @param startTime The start time of the distribution.
     * @param endTime The end time of the distribution.
     * @param distributionRate The distribution rate.
     * @param periodLength The length of each distribution period.
     * @param addressList The AddressList contract address.
     * @return The ID of the created AirdropDistributorWithVesting contract.
     */
    function createAirdropDistributorWithVesting(
        string memory airdropName,
        uint256 startTime,
        uint256 endTime,
        uint256 distributionRate,
        uint256 periodLength,
        address addressList
    ) external onlyOwner returns (uint256) {
        address newAirdropDistributorWithVestingAddress = Clones.clone(
            airdropDistributorWithVestingImplementation
        );
        IAirdropDistributorWithVesting newAirdropDistributorWithVesting = IAirdropDistributorWithVesting(
                newAirdropDistributorWithVestingAddress
            );
        newAirdropDistributorWithVesting.initialize(
            owner(),
            airdropName,
            startTime,
            endTime,
            distributionRate,
            periodLength,
            addressList
        );

        emit AirdropDistributorWithVestingCreated(
            owner(),
            newAirdropDistributorWithVestingAddress,
            airdropDistributorWithVestingCount
        );

        return
            _addNewAirdropDistributorWithVesting(
                newAirdropDistributorWithVestingAddress
            );
    }

    /**
     * @dev Internal function to add a new AirdropDistributor contract address to the mapping.
     * @param _newAirdropDistributorAddress The address of the new AirdropDistributor contract.
     * @return The ID of the added AirdropDistributor contract.
     */
    function _addNewAirdropDistributor(
        address _newAirdropDistributorAddress
    ) internal returns (uint256) {
        airdropDistributors[
            airdropDistributorCount
        ] = _newAirdropDistributorAddress;

        return ++airdropDistributorCount;
    }

    /**
     * @dev Internal function to add a new AirdropDistributorWithVesting contract address to the mapping.
     * @param _newAirdropDistributorWithVestingAddress The address of the new AirdropDistributorWithVesting contract.
     * @return The ID of the added AirdropDistributorWithVesting contract.
     */
    function _addNewAirdropDistributorWithVesting(
        address _newAirdropDistributorWithVestingAddress
    ) internal returns (uint256) {
        airdropDistributorWithVestings[
            airdropDistributorWithVestingCount
        ] = _newAirdropDistributorWithVestingAddress;

        return ++airdropDistributorWithVestingCount;
    }
}

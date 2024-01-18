// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title AddressList
 * @author İsmail Can Vardar github.com/icanvardar, Mehmet Rauf Oğuz github.com/mehmetraufoguz
 * @notice List of which user matched with wallet
 */
contract AddressList is Ownable2Step {
    /// @notice userIDs matched with addresses
    mapping(uint256 => address) public userList;
    /// @notice addresses matched with userIDs
    mapping(address => uint256) public addressList;

    /**
     * @dev Checks provided userID, is issued before
     */
    modifier whenNotIssued(uint256 userID, address walletAddress) {
        require(
            userList[userID] == address(0),
            "AddressList: userID already issued"
        );
        require(
            addressList[walletAddress] == uint256(0),
            "AddressList: address already issued"
        );
        _;
    }

    /**
     * @dev Matches userID with provided walletAddress address
     * @param userID userID of metatime account
     * @param walletAddress matched address by user
     */
    function setWalletAddress(
        uint256 userID,
        address walletAddress
    ) external onlyOwner {
        _setWalletAddress(userID, walletAddress);
    }

    /**
     * @dev Matches userIDs with provided walletAddress addresses
     * @param userIDs userIDs of metatime accounts
     * @param walletAddresses matched addresses by users
     */
    function setWalletAddresses(
        uint256[] memory userIDs,
        address[] memory walletAddresses
    ) external onlyOwner {
        require(
            userIDs.length == walletAddresses.length,
            "AddressList: Provided data incorrect"
        );

        uint8 i;
        for (i; i < userIDs.length; i++) {
            uint256 userID = userIDs[i];
            address walletAddress = walletAddresses[i];

            _setWalletAddress(userID, walletAddress);
        }
    }

    /**
     * @dev Matches userID with provided walletAddress address
     * @param userID userID of metatime account
     * @param walletAddress matched address by user
     */
    function _setWalletAddress(
        uint256 userID,
        address walletAddress
    ) private whenNotIssued(userID, walletAddress) {
        require(userID != uint256(0), "AddressList: Cant set to id 0");
        require(
            walletAddress != address(0),
            "AddressList: Cant set zero address"
        );

        userList[userID] = walletAddress;
        addressList[walletAddress] = userID;
    }
}

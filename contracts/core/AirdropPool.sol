// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

import "../interfaces/IAddressList.sol";

/**
 * @title AirdropPool
 * @dev A contract for distributing coins during no vesting sales.
 */
contract AirdropPool is Initializable, Ownable2Step {
    uint256 public distributionPeriodStart; // The start time of the distribution period
    uint256 public distributionPeriodEnd; // The end time of the distribution period
    uint256 public claimPeriodEnd; // The end time of the claim period
    uint256 public totalAmount; // The total amount of coins available for distribution
    IAddressList public addressList; // Interface of AddressList contract
    mapping(uint256 => uint256) public claimableAmounts; // Mapping of beneficiary addresses to their claimable amounts

    event CanClaim(uint256 indexed beneficiary, uint256 amount); // Event emitted when a beneficiary can claim coins
    event HasClaimed(address indexed beneficiary, uint256 amount); // Event emitted when a beneficiary claims coins
    event Swept(address receiver, uint256 amount); // Event emitted when coins are swept from the contract
    event SetClaimableAmounts(uint256 usersLength, uint256 totalAmount); // Event emitted when claimable amounts are set
    event Deposit(address indexed sender, uint amount, uint balance); // Event emitted when pool received mtc
    event ReceiverSet(uint256 userId, address receiver); // Event emitted when user id is bound to receiver

    /**
     * @dev The receive function is a special function that allows the contract to accept MTC transactions.
     * It emits a Deposit event to record the deposit details.
     */
    receive() external payable {
        emit Deposit(_msgSender(), msg.value, address(this).balance);
    }

    /**
     * @dev Initializes the contract.
     * @param _distributionPeriodStart The start time of the claim period
     * @param _distributionPeriodEnd The end time of the claim period
     * @param _addresList Address of AddresList contract
     */
    function initialize(
        uint256 _distributionPeriodStart,
        uint256 _distributionPeriodEnd,
        address _addressList
    ) external initializer {
        require(
            _distributionPeriodEnd > _distributionPeriodStart,
            "AirdropPool: end time must be bigger than start time"
        );

        distributionPeriodStart = _distributionPeriodStart;
        distributionPeriodEnd = _distributionPeriodEnd;
        claimPeriodEnd = _distributionPeriodEnd + 100 days;
        addressList = IAddressList(_addressList);

        _transferOwnership(_msgSender());
    }

    /**
     * @dev Controls settable status of the contract while trying to set addresses and their amounts.
     */
    modifier isSettable() {
        require(
            block.timestamp < distributionPeriodStart,
            "AirdropPool: claim period has already started"
        );
        _;
    }

    /**
     * @dev Sets the claimable amounts for a list of users.
     * @param userIds The list of user addresses
     * @param amounts The list of claimable amounts corresponding to each user
     */
    function setClaimableAmounts(
        uint256[] calldata userIds,
        uint256[] calldata amounts
    ) external onlyOwner isSettable {
        uint256 usersLength = userIds.length;
        require(
            usersLength == amounts.length,
            "AirdropPool: user and amount list lengths must match"
        );

        uint256 sum = totalAmount;
        for (uint256 i = 0; i < usersLength; i++) {
            uint256 userId = userIds[i];

            require(userId != 0, "AirdropPool: cannot set zero id");

            uint256 amount = amounts[i];

            require(
                claimableAmounts[userId] == 0,
                "AirdropPool: amount already set"
            );

            claimableAmounts[userId] = amount;
            emit CanClaim(userId, amount);

            sum += amounts[i];
        }

        require(
            address(this).balance >= sum,
            "AirdropPool: total claimable amount does not match"
        );
        totalAmount = sum;

        emit SetClaimableAmounts(usersLength, totalAmount);
    }

    /**
     * @dev Allows a beneficiary to claim their coins.
     */
    function claim() external {
        require(
            block.timestamp >= distributionPeriodStart,
            "AirdropPool: coins cannot be claimed yet"
        );
        require(
            block.timestamp <= claimPeriodEnd,
            "AirdropPool: claim period has ended"
        );

        uint256 userId = _getUserId(_msgSender());
        require(userId != 0, "AirdropPool: user not set before");

        uint256 claimableAmount = claimableAmounts[userId];
        require(claimableAmount > 0, "AirdropPool: no coins to claim");

        claimableAmounts[userId] = 0;

        (bool sent, ) = _msgSender().call{value: claimableAmount}("");
        require(sent, "AirdropPool: unable to withdraw");

        emit HasClaimed(_msgSender(), claimableAmount);
    }

    /**
     * @dev Transfers remaining coins from the contract to the owner.
     */
    function sweep() external onlyOwner {
        require(
            block.timestamp > claimPeriodEnd,
            "AirdropPool: cannot sweep before claim end time"
        );

        uint256 leftovers = address(this).balance;
        require(leftovers != 0, "AirdropPool: no leftovers");

        (bool sent, ) = owner().call{value: leftovers}("");
        require(sent, "AirdropPool: unable to withdraw");

        emit Swept(owner(), leftovers);
    }

    /**
     * @dev Get userId by provided walletAddress
     * @param walletAddress address of related userID
     */
    function _getUserId(address walletAddress) view private returns(uint256 userID) {
        userID = addressList.addressList(walletAddress);
    }
}

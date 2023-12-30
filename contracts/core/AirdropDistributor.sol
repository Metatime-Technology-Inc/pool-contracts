// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

import "../interfaces/IAddressList.sol";

/**
 * @title AirdropDistributor
 * @dev A contract for airdrop coins distributing
 */
contract AirdropDistributor is Initializable, Ownable2Step {
    string public airdropName; // The name of the airdrop distribution pool
    uint256 public distributionPeriodStart; // The start time of the distribution period
    uint256 public distributionPeriodEnd; // The end time of the distribution period
    IAddressList public addressList; // Interface of AddressList contract
    mapping(uint256 => uint256) public claimableAmounts; // Mapping of beneficiary addresses to their claimable amounts

    event CanClaim(uint256 indexed beneficiary, uint256 amount); // Event emitted when a beneficiary can claim coins
    event HasClaimed(address indexed beneficiary, uint256 amount); // Event emitted when a beneficiary claims coins
    event Swept(address receiver, uint256 amount); // Event emitted when coins are swept from the contract
    event SetClaimableAmounts(uint256 usersLength, uint256 totalAmount); // Event emitted when claimable amounts are set
    event Deposit(address indexed sender, uint amount, uint balance); // Event emitted when pool received mtc

    /**
     * @dev The receive function is a special function that allows the contract to accept MTC transactions.
     * It emits a Deposit event to record the deposit details.
     */
    receive() external payable {
        emit Deposit(_msgSender(), msg.value, address(this).balance);
    }

    /**
     * @dev Constructor function.
     * It disables the execution of initializers in the contract, as it is not intended to be called directly.
     * The purpose of this function is to prevent accidental execution of initializers when creating proxy instances of the contract.
     * It is called internally during the construction of the proxy contract.
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract.
     * @param _owner The address of the contract owner.
     * @param _airdropName The name of the airdrop distribution pool
     * @param _distributionPeriodStart The start time of the claim period
     * @param _distributionPeriodEnd The end time of the claim period
     * @param _addressList Address of AddresList contract
     */
    function initialize(
        address _owner,
        string memory _airdropName,
        uint256 _distributionPeriodStart,
        uint256 _distributionPeriodEnd,
        address _addressList
    ) external initializer {
        require(
            _distributionPeriodEnd > _distributionPeriodStart,
            "AirdropDistributor: end time must be bigger than start time"
        );

        airdropName = _airdropName;
        distributionPeriodStart = _distributionPeriodStart;
        distributionPeriodEnd = _distributionPeriodEnd;
        addressList = IAddressList(_addressList);

        _transferOwnership(_owner);
    }

    /**
     * @dev Sets the claimable amounts for a list of users.
     * @param userIds The list of user ids
     * @param amounts The list of claimable amounts corresponding to each user
     */
    function setClaimableAmounts(
        uint256[] calldata userIds,
        uint256[] calldata amounts
    ) external onlyOwner {
        uint256 usersLength = userIds.length;
        require(
            usersLength == amounts.length,
            "AirdropDistributor: user and amount list lengths must match"
        );

        uint256 sum;
        for (uint256 i = 0; i < usersLength; i++) {
            uint256 userId = userIds[i];

            require(userId != 0, "AirdropDistributor: cannot set zero id");

            uint256 amount = amounts[i];

            require(
                claimableAmounts[userId] == 0,
                "AirdropDistributor: amount already set"
            );

            claimableAmounts[userId] = amount;
            
            sum += amounts[i];
            emit CanClaim(userId, amount);
        }

        require(
            address(this).balance >= sum,
            "AirdropDistributor: total claimable amount does not match"
        );

        emit SetClaimableAmounts(usersLength, sum);
    }

    /**
     * @dev Allows a beneficiary to claim their coins.
     */
    function claim() external {
        require(
            block.timestamp >= distributionPeriodStart,
            "AirdropDistributor: coins cannot be claimed yet"
        );
        require(
            block.timestamp <= distributionPeriodEnd,
            "AirdropDistributor: claim period has ended"
        );

        uint256 userId = _getUserId(_msgSender());
        require(userId != 0, "AirdropDistributor: user not set before");

        uint256 claimableAmount = claimableAmounts[userId];
        require(claimableAmount > 0, "AirdropDistributor: no coins to claim");

        claimableAmounts[userId] = 0;

        (bool sent, ) = _msgSender().call{value: claimableAmount}("");
        require(sent, "AirdropDistributor: unable to withdraw");

        emit HasClaimed(_msgSender(), claimableAmount);
    }

    /**
     * @dev Transfers remaining coins from the contract to the owner.
     * @param amount Requested amount
     */
    function transfer(uint256 amount) external onlyOwner {
        uint256 leftovers = address(this).balance;
        
        require(leftovers >= amount, "AirdropDistributor: no leftovers");

        (bool sent, ) = owner().call{value: amount}("");
        require(sent, "AirdropDistributor: unable to withdraw");

        emit Swept(owner(), amount);
    }

    /**
     * @dev Get userId by provided walletAddress
     * @param walletAddress address of related userId
     */
    function _getUserId(
        address walletAddress
    ) private view returns (uint256 userId) {
        userId = addressList.addressList(walletAddress);
    }
}

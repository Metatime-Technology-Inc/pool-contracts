// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "../interfaces/IAddressList.sol";

/**
 * @title TokenDistributorWithNoVesting
 * @dev A contract for distributing coins during no vesting sales.
 */
contract TokenDistributorWithNoVesting is Initializable, Ownable2Step {
    uint256 public distributionPeriodStart; // The start time of the distribution period
    uint256 public totalAmount; // The total amount of coins available for distribution
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
     * @dev Initializes the contract.
     * @param _distributionPeriodStart The start time of the claim period
     * @param _addressList Address of AddresList contract
     */
    function initialize(
        uint256 _distributionPeriodStart,
        address _addressList
    ) external initializer {
        distributionPeriodStart = _distributionPeriodStart;
        addressList = IAddressList(_addressList);

        _transferOwnership(_msgSender());
    }

    /**
     * @dev Controls settable status of the contract while trying to set addresses and their amounts.
     */
    modifier isSettable() {
        require(
            block.timestamp < distributionPeriodStart,
            "TokenDistributorWithNoVesting: claim period has already started"
        );
        _;
    }

    /**
     * @dev Sets the claimable amounts for a list of users.
     * @param users The list of user addresses
     * @param amounts The list of claimable amounts corresponding to each user
     */
    function setClaimableAmounts(
        uint256[] calldata users,
        uint256[] calldata amounts
    ) external onlyOwner isSettable {
        uint256 usersLength = users.length;
        require(
            usersLength == amounts.length,
            "TokenDistributorWithNoVesting: user and amount list lengths must match"
        );

        uint256 sum = totalAmount;
        for (uint256 i = 0; i < usersLength; i++) {
            uint256 user = users[i];

            require(
                user != 0,
                "TokenDistributorWithNoVesting: cannot set zero"
            );

            uint256 amount = amounts[i];

            require(
                claimableAmounts[user] == 0,
                "TokenDistributorWithNoVesting: address already set"
            );

            claimableAmounts[user] = amount;
            emit CanClaim(user, amount);

            sum += amounts[i];
        }
        totalAmount = sum;

        emit SetClaimableAmounts(usersLength, totalAmount);
    }

    /**
     * @dev Allows a beneficiary to claim their coins.
     */
    function claim() external {
        require(
            block.timestamp >= distributionPeriodStart,
            "TokenDistributorWithNoVesting: coins cannot be claimed yet"
        );

        uint256 userId = _getUserId(_msgSender());
        require(userId != 0, "TokenDistributor: user not set before");

        uint256 claimableAmount = claimableAmounts[userId];

        require(
            claimableAmount > 0,
            "TokenDistributorWithNoVesting: no coins to claim"
        );

        claimableAmounts[userId] = 0;

        (bool sent, ) = _msgSender().call{value: claimableAmount}("");
        require(sent, "TokenDistributorWithNoVesting: unable to withdraw");

        emit HasClaimed(_msgSender(), claimableAmount);
    }

    /**
     * @dev Transfers remaining coins from the contract to the owner.
     */
    function sweep() external onlyOwner {
        uint256 leftovers = address(this).balance;
        require(leftovers != 0, "TokenDistributorWithNoVesting: no leftovers");

        (bool sent, ) = owner().call{value: leftovers}("");
        require(sent, "TokenDistributorWithNoVesting: unable to withdraw");

        emit Swept(owner(), leftovers);
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

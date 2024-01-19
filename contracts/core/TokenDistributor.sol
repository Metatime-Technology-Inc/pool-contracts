// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "../interfaces/IAddressList.sol";

/**
 * @title TokenDistributor
 * @dev A contract for distributing coins among users over a specific period of time.
 */
contract TokenDistributor is Initializable, Ownable2Step {
    string public poolName; // The name of the mtc distribution pool
    uint256 public distributionPeriodStart; // The start time of the distribution period
    uint256 public distributionPeriodEnd; // The end time of the distribution period
    uint256 public periodLength; // The length of each distribution period (in seconds)
    uint256 public distributionRate; // The distribution rate (percentage)
    uint256 public totalClaimableAmount; // The total claimable amount that participants can claim
    uint256 public constant BASE_DIVIDER = 10_000; // The base divider used for calculations
    IAddressList public addressList; // Interface of AddressList contract
    mapping(uint256 => uint256) public claimableAmounts; // Mapping of user addresses to their claimable amounts
    mapping(uint256 => uint256) public claimedAmounts; // Mapping of user addresses to their claimed amounts
    mapping(uint256 => uint256) public lastClaimTimes; // Mapping of user addresses to their last claim times
    mapping(uint256 => uint256) public leftClaimableAmounts; // Mapping of user addresses to their remaining claimable amounts
    bool private hasClaimableAmountsSet; // It is used to prevent updating pool params

    event Swept(address receiver, uint256 amount); // Event emitted when the contract owner sweeps remaining coins
    event CanClaim(uint256 indexed beneficiary, uint256 amount); // Event emitted when a user can claim coins
    event HasClaimed(address indexed beneficiary, uint256 amount); // Event emitted when a user has claimed coins
    event SetClaimableAmounts(uint256 usersLength, uint256 totalAmount); // Event emitted when claimable amounts are set
    event PoolParamsUpdated(
        uint256 newDistributionPeriodStart,
        uint256 newDistributionPeriodEnd,
        uint256 newDistributionRate,
        uint256 newPeriodLength
    ); // Event emitted when pool params are updated
    event Deposit(address indexed sender, uint amount, uint balance); // Event emitted when pool received mtc

    /**
     * @dev disableInitializers function.
     * It disables the execution of initializers in the contract, as it is not intended to be called directly.
     * The purpose of this function is to prevent accidental execution of initializers when creating proxy instances of the contract.
     * It is called internally during the construction of the proxy contract.
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev The receive function is a special function that allows the contract to accept MTC transactions.
     * It emits a Deposit event to record the deposit details.
     */
    receive() external payable {
        emit Deposit(_msgSender(), msg.value, address(this).balance);
    }

    /**
     * @dev A modifier that validates pool parameters
     * @param _distributionPeriodStart Start timestamp of claim period
     * @param _distributionPeriodEnd End timestamp of claim period
     * @param _distributionRate Distribution rate of each claim
     * @param _periodLength Distribution duration of each claim
     */
    modifier isParamsValid(
        uint256 _distributionPeriodStart,
        uint256 _distributionPeriodEnd,
        uint256 _distributionRate,
        uint256 _periodLength
    ) {
        require(
            _distributionPeriodEnd > _distributionPeriodStart,
            "TokenDistributor: end time must be bigger than start time"
        );
        _;
    }

    /**
     * @dev Initializes the TokenDistributor contract.
     * @param _owner The address of the contract owner
     * @param _poolName The name of the mtc distribution pool
     * @param _distributionPeriodStart The start time of the distribution period
     * @param _distributionPeriodEnd The end time of the distribution period
     * @param _distributionRate The distribution rate (percentage)
     * @param _periodLength The length of each distribution period (in seconds)
     * @param _addressList Address of AddresList contract
     */
    function initialize(
        address _owner,
        string memory _poolName,
        uint256 _distributionPeriodStart,
        uint256 _distributionPeriodEnd,
        uint256 _distributionRate,
        uint256 _periodLength,
        address _addressList
    )
        external
        initializer
        isParamsValid(
            _distributionPeriodStart,
            _distributionPeriodEnd,
            _distributionRate,
            _periodLength
        )
    {
        _transferOwnership(_owner);

        poolName = _poolName;
        distributionPeriodStart = _distributionPeriodStart;
        distributionPeriodEnd = _distributionPeriodEnd;
        distributionRate = _distributionRate;
        periodLength = _periodLength;
        addressList = IAddressList(_addressList);
    }

    /**
     * @dev Sets the claimable amounts for a list of users.
     * Only the owner can call this function before the claim period starts.
     * @param lastClaimTimes_ An array of last claim times of addresses
     * @param users An array of user addresses
     * @param amounts An array of claimable amounts corresponding to each user
     */
    function setClaimableAmounts(
        uint256[] calldata lastClaimTimes_,
        uint256[] calldata users,
        uint256[] calldata amounts,
        uint256[] calldata leftAmounts
    ) external onlyOwner {
        uint256 usersLength = users.length;
        require(
            usersLength == amounts.length,
            "TokenDistributor: lists' lengths must match"
        );

        uint256 sum = totalClaimableAmount;
        for (uint256 i = 0; i < usersLength; i++) {
            uint256 user = users[i];

            require(user != 0, "TokenDistributor: cannot set zero");

            uint256 amount = amounts[i];
            uint256 leftAmount = leftAmounts[i];
            uint256 lastClaimTime = lastClaimTimes_[i];

            require(
                claimableAmounts[user] == 0,
                "TokenDistributor: address already set"
            );

            claimableAmounts[user] = amount;
            leftClaimableAmounts[user] = leftAmount;
            lastClaimTimes[user] = lastClaimTime;
            emit CanClaim(user, amount);

            sum += leftAmounts[i];
        }

        require(
            address(this).balance >= sum,
            "TokenDistributor: total claimable amount does not match"
        );

        totalClaimableAmount = sum;
        hasClaimableAmountsSet = true;

        emit SetClaimableAmounts(usersLength, totalClaimableAmount);
    }

    /**
     * @dev Allows a user to claim their available coins.
     * Tokens can only be claimed during the distribution period.
     */
    function claim() external returns (bool) {
        require(
            block.timestamp >= distributionPeriodStart,
            "TokenDistributor: distribution has not started yet"
        );

        address sender = _msgSender();

        uint256 userId = _getUserId(sender);
        require(userId != 0, "TokenDistributor: user not set before");

        uint256 claimableAmount = calculateClaimableAmount(userId);

        require(claimableAmount > 0, "TokenDistributor: no coins to claim");

        claimedAmounts[userId] = claimedAmounts[userId] + claimableAmount;

        lastClaimTimes[userId] = block.timestamp;

        leftClaimableAmounts[userId] =
            leftClaimableAmounts[userId] -
            claimableAmount;

        (bool sent, ) = sender.call{value: claimableAmount}("");
        require(sent, "TokenDistributor: unable to claim");

        emit HasClaimed(sender, claimableAmount);

        return true;
    }

    /**
     * @dev Allows the contract owner to sweep any remaining coins after the claim period ends.
     * Tokens are transferred to the contract owner's address.
     */
    function sweep() external onlyOwner {
        uint256 leftovers = address(this).balance;
        require(leftovers != 0, "TokenDistributor: no leftovers");

        (bool sent, ) = owner().call{value: leftovers}("");
        require(sent, "TokenDistributor: unable to claim");

        emit Swept(owner(), leftovers);
    }

    /**
     * @dev Updates pool parameters before claim period and only callable by contract owner
     * @param newDistributionPeriodStart New start timestamp of distribution period
     * @param newDistributionPeriodEnd New end timestamp of distribution period
     * @param newDistributionRate New distribution rate of each claim
     * @param newPeriodLength New distribution duration of each claim
     */
    function updatePoolParams(
        uint256 newDistributionPeriodStart,
        uint256 newDistributionPeriodEnd,
        uint256 newDistributionRate,
        uint256 newPeriodLength
    )
        external
        onlyOwner
        isParamsValid(
            newDistributionPeriodStart,
            newDistributionPeriodEnd,
            newDistributionRate,
            newPeriodLength
        )
        returns (bool)
    {
        require(
            hasClaimableAmountsSet == false,
            "TokenDistributor: claimable amounts were set before"
        );

        distributionPeriodStart = newDistributionPeriodStart;
        distributionPeriodEnd = newDistributionPeriodEnd;
        distributionRate = newDistributionRate;
        periodLength = newPeriodLength;

        emit PoolParamsUpdated(
            newDistributionPeriodStart,
            newDistributionPeriodEnd,
            newDistributionRate,
            newPeriodLength
        );

        return true;
    }

    /**
     * @dev Calculates the claimable amount of coins for a given user.
     * The claimable amount depends on the number of days that have passed since the last claim.
     * @param user The address of the user
     * @return The claimable amount of coins for the user
     */
    function calculateClaimableAmount(
        uint256 user
    ) public view returns (uint256) {
        uint256 claimableAmount = 0;
        if (block.timestamp >= distributionPeriodEnd) {
            claimableAmount = leftClaimableAmounts[user];
        } else {
            claimableAmount = _calculateClaimableAmount(user);
        }

        return claimableAmount;
    }

    /**
     * @dev Calculates the amount of coins that can be claimed by a given address
     * based on the number of days that have passed since the last claim.
     * @param user The address of the user
     * @return The amount of coins that can be claimed by the user
     */
    function _calculateClaimableAmount(
        uint256 user
    ) internal view returns (uint256) {
        return
            (claimableAmounts[user] *
                distributionRate *
                (block.timestamp - lastClaimTimes[user]) *
                10 ** 18) / (periodLength * BASE_DIVIDER * 10 ** 18);
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

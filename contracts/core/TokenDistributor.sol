// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TokenDistributor
 * @dev A contract for distributing tokens among users over a specific period of time.
 */
contract TokenDistributor is Initializable, Ownable2Step, ReentrancyGuard {
    string public poolName; // The name of the token distribution pool
    IERC20 public token; // The ERC20 token being distributed
    uint256 public distributionPeriodStart; // The start time of the distribution period
    uint256 public distributionPeriodEnd; // The end time of the distribution period
    uint256 public claimPeriodEnd; // The end time of the claim period
    uint256 public periodLength; // The length of each distribution period (in seconds)
    uint256 public distributionRate; // The distribution rate (percentage)
    uint256 public totalClaimableAmount; // The total claimable amount that participants can claim
    uint256 public constant BASE_DIVIDER = 10_000; // The base divider used for calculations
    mapping(address => uint256) public claimableAmounts; // Mapping of user addresses to their claimable amounts
    mapping(address => uint256) public claimedAmounts; // Mapping of user addresses to their claimed amounts
    mapping(address => uint256) public lastClaimTimes; // Mapping of user addresses to their last claim times
    mapping(address => uint256) public leftClaimableAmounts; // Mapping of user addresses to their remaining claimable amounts
    bool private hasClaimableAmountsSet = false; // It is used to prevent updating pool params

    event Swept(address receiver, uint256 amount); // Event emitted when the contract owner sweeps remaining tokens
    event CanClaim(address indexed beneficiary, uint256 amount); // Event emitted when a user can claim tokens
    event HasClaimed(address indexed beneficiary, uint256 amount); // Event emitted when a user has claimed tokens
    event SetClaimableAmounts(uint256 usersLength, uint256 totalAmount); // Event emitted when claimable amounts are set
    event PoolParamsUpdated(
        uint256 newDistributionPeriodStart,
        uint256 newDistributionPeriodEnd,
        uint256 newDistributionRate,
        uint256 newPeriodLength
    ); // Event emitted when pool params are updated

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

        require(
            (BASE_DIVIDER / _distributionRate) * _periodLength ==
                _distributionPeriodEnd - _distributionPeriodStart,
            "TokenDistributor: invalid parameters"
        );
        _;
    }

    /**
     * @dev Controls settable status of contract while trying to set addresses and their amounts.
     */
    modifier isSettable() {
        require(
            block.timestamp < distributionPeriodStart,
            "TokenDistributor: claim period has already started"
        );
        _;
    }

    /**
     * @dev Initializes the TokenDistributor contract.
     * @param _owner The address of the contract owner
     * @param _poolName The name of the token distribution pool
     * @param _token The ERC20 token being distributed
     * @param _distributionPeriodStart The start time of the distribution period
     * @param _distributionPeriodEnd The end time of the distribution period
     * @param _distributionRate The distribution rate (percentage)
     * @param _periodLength The length of each distribution period (in seconds)
     */
    function initialize(
        address _owner,
        string memory _poolName,
        address _token,
        uint256 _distributionPeriodStart,
        uint256 _distributionPeriodEnd,
        uint256 _distributionRate,
        uint256 _periodLength
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
        token = IERC20(_token);
        distributionPeriodStart = _distributionPeriodStart;
        distributionPeriodEnd = _distributionPeriodEnd;
        claimPeriodEnd = _distributionPeriodEnd + 100 days;
        distributionRate = _distributionRate;
        periodLength = _periodLength;
    }

    /**
     * @dev Sets the claimable amounts for a list of users.
     * Only the owner can call this function before the claim period starts.
     * @param users An array of user addresses
     * @param amounts An array of claimable amounts corresponding to each user
     */
    function setClaimableAmounts(
        address[] calldata users,
        uint256[] calldata amounts
    ) external onlyOwner isSettable {
        uint256 usersLength = users.length;
        require(
            usersLength == amounts.length,
            "TokenDistributor: lists' lengths must match"
        );

        uint256 sum = totalClaimableAmount;
        for (uint256 i = 0; i < usersLength; i++) {
            address user = users[i];

            require(
                user != address(0),
                "TokenDistributor: cannot set zero address"
            );

            uint256 amount = amounts[i];

            require(
                claimableAmounts[user] == 0,
                "TokenDistributor: address already set"
            );

            claimableAmounts[user] = amount;
            leftClaimableAmounts[user] = amount;
            lastClaimTimes[user] = distributionPeriodStart;
            emit CanClaim(user, amount);

            unchecked {
                sum += amounts[i];
            }
        }

        require(
            token.balanceOf(address(this)) >= sum,
            "TokenDistributor: total claimable amount does not match"
        );

        totalClaimableAmount = sum;
        hasClaimableAmountsSet = true;

        emit SetClaimableAmounts(usersLength, totalClaimableAmount);
    }

    /**
     * @dev Allows a user to claim their available tokens.
     * Tokens can only be claimed during the distribution period.
     */
    function claim() external nonReentrant returns (bool) {
        address sender = _msgSender();
        uint256 claimableAmount = calculateClaimableAmount(sender);

        require(claimableAmount > 0, "TokenDistributor: no tokens to claim");

        claimedAmounts[sender] = claimedAmounts[sender] + claimableAmount;

        lastClaimTimes[sender] = block.timestamp;

        leftClaimableAmounts[sender] =
            leftClaimableAmounts[sender] -
            claimableAmount;

        SafeERC20.safeTransfer(token, sender, claimableAmount);

        emit HasClaimed(sender, claimableAmount);

        return true;
    }

    /**
     * @dev Allows the contract owner to sweep any remaining tokens after the claim period ends.
     * Tokens are transferred to the contract owner's address.
     */
    function sweep() external onlyOwner {
        require(
            block.timestamp > claimPeriodEnd,
            "TokenDistributor: cannot sweep before claim period end time"
        );

        uint256 leftovers = token.balanceOf(address(this));
        require(leftovers != 0, "TokenDistributor: no leftovers");

        SafeERC20.safeTransfer(token, owner(), leftovers);

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
        isSettable
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
        claimPeriodEnd = newDistributionPeriodEnd + 100 days;
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
     * @dev Calculates the claimable amount of tokens for a given user.
     * The claimable amount depends on the number of days that have passed since the last claim.
     * @param user The address of the user
     * @return The claimable amount of tokens for the user
     */
    function calculateClaimableAmount(
        address user
    ) public view returns (uint256) {
        require(
            block.timestamp < claimPeriodEnd,
            "TokenDistributor: claim period ended"
        );

        require(
            block.timestamp >= distributionPeriodStart,
            "TokenDistributor: distribution has not started yet"
        );

        uint256 claimableAmount = 0;
        if (
            block.timestamp >= distributionPeriodEnd &&
            block.timestamp <= claimPeriodEnd
        ) {
            claimableAmount = leftClaimableAmounts[user];
        } else {
            claimableAmount = _calculateClaimableAmount(user);
        }

        return claimableAmount;
    }

    /**
     * @dev Calculates the amount of tokens that can be claimed by a given address
     * based on the number of days that have passed since the last claim.
     * @param user The address of the user
     * @return The amount of tokens that can be claimed by the user
     */
    function _calculateClaimableAmount(
        address user
    ) internal view returns (uint256) {
        uint256 initialAmount = claimableAmounts[user];
        uint256 periodSinceLastClaim = ((block.timestamp -
            lastClaimTimes[user]) * 10 ** 18) / periodLength;

        return
            (((initialAmount * distributionRate) * periodSinceLastClaim)) /
            BASE_DIVIDER /
            10 ** 18;
    }
}

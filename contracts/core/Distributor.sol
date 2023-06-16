// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Distributor
 * @notice Holds tokens for users to claim.
 * @dev A contract for distributing tokens over a specified period of time.
 */
contract Distributor is Initializable, Ownable2Step {
    string public poolName; // Name of the token distribution pool
    IERC20 public token; // Token to be distributed
    uint256 public startTime; // Start time of the distribution
    uint256 public endTime; // End time of the distribution
    uint256 public periodLength; // Length of each distribution period
    uint256 public distributionRate; // Rate of token distribution per period
    uint256 public constant BASE_DIVIDER = 10_000; // Base divider for distribution rate calculation
    uint256 public claimableAmount; // Total amount of tokens claimable per period
    uint256 public claimedAmount; // Total amount of tokens claimed so far
    uint256 public lastClaimTime; // Timestamp of the last token claim
    uint256 public leftClaimableAmount; // Remaining amount of tokens available for claiming

    event HasClaimed(address indexed beneficiary, uint256 amount); // Event emitted when a beneficiary has claimed tokens
    event PoolParamsUpdated(
        uint256 newStartTime,
        uint256 newEndTime,
        uint256 newDistributionRate,
        uint256 newPeriodLength,
        uint256 newClaimableAmount
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
     * @dev A modifier that validates pool parameters.
     * @param _startTime Start timestamp of claim period.
     * @param _endTime End timestamp of claim period.
     * @param _distributionRate Distribution rate of each claim.
     * @param _periodLength Distribution duration of each claim.
     */
    modifier isParamsValid(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _distributionRate,
        uint256 _periodLength
    ) {
        require(
            _startTime < _endTime,
            "Distributor: end time must be bigger than start time"
        );

        require(
            (BASE_DIVIDER / _distributionRate) * _periodLength ==
                _endTime - _startTime,
            "Distributor: invalid parameters"
        );
        _;
    }

    /**
     * @dev Controls settable status of contract while trying to set addresses and their amounts.
     */
    modifier isSettable() {
        require(
            block.timestamp < startTime,
            "Distributor: claim period has already started"
        );
        _;
    }

    /**
     * @dev Initializes the contract with the specified parameters.
     * @param _owner The address of the contract owner.
     * @param _poolName The name of the token distribution pool.
     * @param _token The token to be distributed.
     * @param _startTime The start time of the distribution.
     * @param _endTime The end time of the distribution.
     * @param _distributionRate The rate of token distribution per period.
     * @param _periodLength The length of each distribution period.
     * @param _claimableAmount The total amount of tokens claimable per period.
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
    )
        external
        initializer
        isParamsValid(_startTime, _endTime, _distributionRate, _periodLength)
    {
        _transferOwnership(_owner);

        poolName = _poolName;
        token = IERC20(_token);
        startTime = _startTime;
        endTime = _endTime;
        distributionRate = _distributionRate;
        periodLength = _periodLength;
        lastClaimTime = _startTime;
        claimableAmount = _claimableAmount;
        leftClaimableAmount = _claimableAmount;
    }

    /**
     * @dev Claim tokens for the sender.
     * @return A boolean indicating whether the claim was successful.
     */
    function claim() external onlyOwner returns (bool) {
        uint256 amount = calculateClaimableAmount();

        claimedAmount += amount;

        lastClaimTime = block.timestamp;

        leftClaimableAmount -= amount;

        SafeERC20.safeTransfer(token, owner(), amount);

        emit HasClaimed(owner(), amount);

        return true;
    }

    /**
     * @dev Updates pool parameters before the claim period and only callable by the contract owner.
     * @param newStartTime New start timestamp of the claim period.
     * @param newEndTime New end timestamp of the claim period.
     * @param newDistributionRate New distribution rate of each claim.
     * @param newPeriodLength New distribution duration of each claim.
     * @param newClaimableAmount New claimable amount of the pool.
     */
    function updatePoolParams(
        uint256 newStartTime,
        uint256 newEndTime,
        uint256 newDistributionRate,
        uint256 newPeriodLength,
        uint256 newClaimableAmount
    )
        external
        onlyOwner
        isSettable
        isParamsValid(
            newStartTime,
            newEndTime,
            newDistributionRate,
            newPeriodLength
        )
        returns (bool)
    {
        startTime = newStartTime;
        endTime = newEndTime;
        distributionRate = newDistributionRate;
        periodLength = newPeriodLength;
        claimableAmount = newClaimableAmount;
        lastClaimTime = newStartTime;

        emit PoolParamsUpdated(
            newStartTime,
            newEndTime,
            newDistributionRate,
            newPeriodLength,
            newClaimableAmount
        );

        return true;
    }

    /**
     * @dev Calculates the amount of tokens claimable for the current period.
     * @return The amount of tokens claimable for the current period.
     */
    function calculateClaimableAmount() public view returns (uint256) {
        require(
            block.timestamp >= startTime,
            "Distributor: distribution has not started yet"
        );

        uint256 amount = 0;
        if (block.timestamp > endTime) {
            amount = leftClaimableAmount;
        } else {
            amount = _calculateClaimableAmount();
        }

        require(amount > 0, "calculateClaimableAmount: No tokens to claim");

        return amount;
    }

    /**
     * @dev Internal function to calculate the amount of tokens claimable for the current period.
     * @return The amount of tokens claimable for the current period.
     */
    function _calculateClaimableAmount() internal view returns (uint256) {
        uint256 initialAmount = claimableAmount;
        uint256 periodSinceLastClaim = ((block.timestamp - lastClaimTime) *
            10 ** 18) / periodLength;

        return
            (((initialAmount * distributionRate) * periodSinceLastClaim)) /
            (BASE_DIVIDER * 10 ** 18);
    }
}

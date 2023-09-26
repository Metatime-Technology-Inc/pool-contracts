// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import "../interfaces/IMetaminer.sol";
import "../interfaces/IMinerFormulas.sol";

/**
 * @title RewardsPool
 * @notice Holds tokens for miners to claim.
 * @dev A contract for distributing tokens over a specified period of time for mining purposes.
 */
contract RewardsPool is Initializable, Ownable2Step {
    uint256 currentBlock = 0;
    IMetaminer public metaminer;
    IMinerFormulas public minerFormulas;
    mapping(address => uint256) public claimedAmounts; // Total amount of tokens claimed so far
    mapping(address => bool) public managers; // Managers of the contract

    event HasClaimed(address indexed beneficiary, uint256 amount); // Event emitted when a beneficiary has claimed tokens
    event Deposit(address indexed sender, uint amount, uint balance); // Event emitted when pool received mtc
    event SetManagers(address[] indexed managers); // Event emitted when managers set by owner

    /**
     * @dev Checks manager accessibility.
     */
    modifier onlyManager() {
        require(
            managers[_msgSender()] == true,
            "RewardsPool: address is not manager"
        );
        _;
    }

    /**
     * @dev Initializes the contract with the specified parameters.
     * @param owner The address of the contract owner.
     * @param metaminerAddress Address of Metaminer contract.
     */
    function initialize(
        address owner,
        address metaminerAddress,
        address minerFormulasAddress
    ) external initializer {
        _transferOwnership(owner);
        metaminer = IMetaminer(metaminerAddress);
        minerFormulas = IMinerFormulas(minerFormulasAddress);
    }

    /**
     * @dev Sets new manager addresses.
     * @return A boolean indicating whether the address setting was successful.
     */
    function setManagers(
        address[] memory newManagers
    ) external onlyOwner returns (bool) {
        uint256 i = 0;
        uint256 newManagersLength = newManagers.length;
        for (i; i < newManagersLength; i++) {
            address newManagerAddress = newManagers[i];
            managers[newManagerAddress] = true;
        }

        return true;
    }

    /**
     * @dev Claim tokens for the sender.
     * @return A boolean indicating whether the claim was successful.
     */
    function claim(address receiver) external onlyManager returns (uint256) {
        // external call blok yapısını al
        uint256 amount = calculateClaimableAmount();

        claimedAmounts[receiver] += amount;

        (bool sent, ) = receiver.call{value: amount}("");
        require(sent, "RewardsPool: unable to claim");

        emit HasClaimed(owner(), amount);

        return amount;
    }

    /**
     * @dev Calculates the amount of tokens claimable for the current period.
     * @return The amount of tokens claimable for the current period.
     */
    function calculateClaimableAmount() public view returns (uint256) {
        return _calculateClaimableAmount();
    }

    /**
     * @dev Internal function to calculate the amount of tokens claimable for the current period.
     * @return The amount of tokens claimable for the current period.
     */
    function _calculateClaimableAmount() internal view returns (uint256) {
        return minerFormulas.calculateMetaminerReward();
    }

    receive() external payable {
        emit Deposit(_msgSender(), msg.value, address(this).balance);
    }
}

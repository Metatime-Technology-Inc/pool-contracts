// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;
import "../libs/MinerTypes.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MinerList is Initializable, AccessControl {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    mapping(address => mapping(MinerTypes.NodeType => bool)) public list;
    mapping(MinerTypes.NodeType => uint256) public count;

    event AddMiner(
        address indexed minerAddress,
        MinerTypes.NodeType indexed nodeType
    );
    event DeleteMiner(
        address indexed minerAddress,
        MinerTypes.NodeType indexed nodeType
    );

    function initialize(address ownerAddress) external initializer {
        _grantRole(OWNER_ROLE, ownerAddress);
        _setRoleAdmin(MANAGER_ROLE, OWNER_ROLE);
        _setRoleAdmin(VALIDATOR_ROLE, OWNER_ROLE);
    }

    function isMiner(
        address minerAddress,
        MinerTypes.NodeType nodeType
    ) external view returns (bool) {
        return list[minerAddress][nodeType];
    }

    function addMiner(
        address minerAddress,
        MinerTypes.NodeType nodeType
    ) external onlyRole(MANAGER_ROLE) returns (bool) {
        _addMiner(minerAddress, nodeType);
        return (true);
    }

    function deleteMiner(
        address minerAddress,
        MinerTypes.NodeType nodeType
    ) external onlyRole(MANAGER_ROLE) returns (bool) {
        _deleteMiner(minerAddress, nodeType);
        return (true);
    }

    function _addMiner(
        address minerAddress,
        MinerTypes.NodeType nodeType
    ) internal returns (bool) {
        list[minerAddress][nodeType] = true;
        count[nodeType]++;

        emit AddMiner(minerAddress, nodeType);
        return (true);
    }

    function _deleteMiner(
        address minerAddress,
        MinerTypes.NodeType nodeType
    ) internal returns (bool) {
        delete list[minerAddress][nodeType];
        count[nodeType]--;

        emit DeleteMiner(minerAddress, nodeType);
        return (true);
    }
}

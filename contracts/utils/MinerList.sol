// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;
import "../libs/MinerTypes.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MinerList is Initializable, AccessControl {
    mapping(address => mapping(MinerTypes.NodeType => bool)) public list;

    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    function initialize(
        address ownerAddress,
        address[] memory managerAddresses
    ) public initializer {
        _grantRole(OWNER_ROLE, ownerAddress);
        _addManager(managerAddresses);
    }

    function isMiner(
        address minerAddress,
        MinerTypes.NodeType nodeType
    ) external view returns (bool) {
        return list[minerAddress][nodeType];
    }

    function addManager(
        address[] memory managerAddresses
    ) external onlyRole(OWNER_ROLE) returns (bool) {
        _addManager(managerAddresses);
        return (true);
    }

    function deleteManager(
        address[] memory managerAddresses
    ) external onlyRole(OWNER_ROLE) returns (bool) {
        _deleteManager(managerAddresses);
        return (true);
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

    function _addManager(
        address[] memory managerAddresses
    ) internal returns (bool) {
        for (uint256 i = 0; i < managerAddresses.length; i++) {
            require(managerAddresses[i] != address(0), "Wrong address.");
            address addr = managerAddresses[i];
            _grantRole(MANAGER_ROLE, addr);
        }
        return (true);
    }

    function _deleteManager(
        address[] memory managerAddresses
    ) internal returns (bool) {
        for (uint256 i = 0; i < managerAddresses.length; i++) {
            require(
                hasRole(MANAGER_ROLE, managerAddresses[i]),
                "Address is not manager."
            );
            address addr = managerAddresses[i];
            _revokeRole(MANAGER_ROLE, addr);
        }
        return (true);
    }

    function _addMiner(
        address minerAddress,
        MinerTypes.NodeType nodeType
    ) internal returns (bool) {
        list[minerAddress][nodeType] = true;
        return (true);
    }

    function _deleteMiner(
        address minerAddress,
        MinerTypes.NodeType nodeType
    ) internal returns (bool) {
        delete list[minerAddress][nodeType];
        return (true);
    }
}

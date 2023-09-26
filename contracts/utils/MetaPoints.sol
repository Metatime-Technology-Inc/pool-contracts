// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MetaPoints is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable
{
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    function initialize(
        address ownerAddress
    ) public initializer {
        __ERC20_init("Meta Points", "MP");
        __ERC20Burnable_init();
        __Pausable_init();
        __AccessControl_init();

        _grantRole(OWNER_ROLE, ownerAddress);
        _setRoleAdmin(MANAGER_ROLE, OWNER_ROLE);
    }

    function pause() public onlyRole(OWNER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(OWNER_ROLE) {
        _unpause();
    }

    function mint(
        address to,
        uint256 amount
    ) public whenNotPaused onlyRole(MANAGER_ROLE) {
        _mint(to, amount);
    }

    function burn(uint256 amount) public virtual override {}

    function burnFrom(
        address account,
        uint256 amount
    ) public virtual override onlyRole(MANAGER_ROLE) {
        _burn(account, amount);
    }

    function transfer(
        address to,
        uint256 amount
    ) public virtual override returns (bool) {}

    function approve(
        address spender,
        uint256 amount
    ) public virtual override returns (bool) {}

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {}

    function increaseAllowance(
        address spender,
        uint256 addedValue
    ) public virtual override returns (bool) {}

    function decreaseAllowance(
        address spender,
        uint256 subtractedValue
    ) public virtual override returns (bool) {}

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}

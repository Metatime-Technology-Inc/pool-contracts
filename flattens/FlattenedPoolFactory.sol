// Sources flattened with hardhat v2.10.2 https://hardhat.org

// File @openzeppelin/contracts/utils/Context.sol@v4.9.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)

pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v4.9.0


// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/access/Ownable2Step.sol@v4.9.0


// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable2Step.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership} and {acceptOwnership}.
 *
 * This module is used through inheritance. It will make available all functions
 * from parent (Ownable).
 */
abstract contract Ownable2Step is Ownable {
    address private _pendingOwner;

    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Returns the address of the pending owner.
     */
    function pendingOwner() public view virtual returns (address) {
        return _pendingOwner;
    }

    /**
     * @dev Starts the ownership transfer of the contract to a new account. Replaces the pending transfer if there is one.
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual override onlyOwner {
        _pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner(), newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`) and deletes any pending owner.
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual override {
        delete _pendingOwner;
        super._transferOwnership(newOwner);
    }

    /**
     * @dev The new owner accepts the ownership transfer.
     */
    function acceptOwnership() public virtual {
        address sender = _msgSender();
        require(pendingOwner() == sender, "Ownable2Step: caller is not the new owner");
        _transferOwnership(sender);
    }
}


// File @openzeppelin/contracts/proxy/Clones.sol@v4.9.0


// OpenZeppelin Contracts (last updated v4.9.0) (proxy/Clones.sol)

pragma solidity ^0.8.0;

/**
 * @dev https://eips.ethereum.org/EIPS/eip-1167[EIP 1167] is a standard for
 * deploying minimal proxy contracts, also known as "clones".
 *
 * > To simply and cheaply clone contract functionality in an immutable way, this standard specifies
 * > a minimal bytecode implementation that delegates all calls to a known, fixed address.
 *
 * The library includes functions to deploy a proxy using either `create` (traditional deployment) or `create2`
 * (salted deterministic deployment). It also includes functions to predict the addresses of clones deployed using the
 * deterministic method.
 *
 * _Available since v3.4._
 */
library Clones {
    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `implementation`.
     *
     * This function uses the create opcode, which should never revert.
     */
    function clone(address implementation) internal returns (address instance) {
        /// @solidity memory-safe-assembly
        assembly {
            // Cleans the upper 96 bits of the `implementation` word, then packs the first 3 bytes
            // of the `implementation` address with the bytecode before the address.
            mstore(0x00, or(shr(0xe8, shl(0x60, implementation)), 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000))
            // Packs the remaining 17 bytes of `implementation` with the bytecode after the address.
            mstore(0x20, or(shl(0x78, implementation), 0x5af43d82803e903d91602b57fd5bf3))
            instance := create(0, 0x09, 0x37)
        }
        require(instance != address(0), "ERC1167: create failed");
    }

    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `implementation`.
     *
     * This function uses the create2 opcode and a `salt` to deterministically deploy
     * the clone. Using the same `implementation` and `salt` multiple time will revert, since
     * the clones cannot be deployed twice at the same address.
     */
    function cloneDeterministic(address implementation, bytes32 salt) internal returns (address instance) {
        /// @solidity memory-safe-assembly
        assembly {
            // Cleans the upper 96 bits of the `implementation` word, then packs the first 3 bytes
            // of the `implementation` address with the bytecode before the address.
            mstore(0x00, or(shr(0xe8, shl(0x60, implementation)), 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000))
            // Packs the remaining 17 bytes of `implementation` with the bytecode after the address.
            mstore(0x20, or(shl(0x78, implementation), 0x5af43d82803e903d91602b57fd5bf3))
            instance := create2(0, 0x09, 0x37, salt)
        }
        require(instance != address(0), "ERC1167: create2 failed");
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt,
        address deployer
    ) internal pure returns (address predicted) {
        /// @solidity memory-safe-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(add(ptr, 0x38), deployer)
            mstore(add(ptr, 0x24), 0x5af43d82803e903d91602b57fd5bf3ff)
            mstore(add(ptr, 0x14), implementation)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73)
            mstore(add(ptr, 0x58), salt)
            mstore(add(ptr, 0x78), keccak256(add(ptr, 0x0c), 0x37))
            predicted := keccak256(add(ptr, 0x43), 0x55)
        }
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt
    ) internal view returns (address predicted) {
        return predictDeterministicAddress(implementation, salt, address(this));
    }
}


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v4.9.0


// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}


// File @openzeppelin/contracts/utils/Address.sol@v4.9.0


// OpenZeppelin Contracts (last updated v4.9.0) (utils/Address.sol)

pragma solidity ^0.8.1;

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     *
     * Furthermore, `isContract` will also return true if the target contract within
     * the same transaction is already scheduled for destruction by `SELFDESTRUCT`,
     * which only has an effect at the end of a transaction.
     * ====
     *
     * [IMPORTANT]
     * ====
     * You shouldn't rely on `isContract` to protect against flash loan attacks!
     *
     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets
     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract
     * constructor.
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.8.0/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, "Address: low-level call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Tool to verify that a low level call to smart-contract was successful, and revert (either by bubbling
     * the revert reason or using the provided one) in case of unsuccessful call or if target was not a contract.
     *
     * _Available since v4.8._
     */
    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        if (success) {
            if (returndata.length == 0) {
                // only check isContract if the call was successful and the return data is empty
                // otherwise we already know that it was a contract
                require(isContract(target), "Address: call to non-contract");
            }
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    /**
     * @dev Tool to verify that a low level call was successful, and revert if it wasn't, either by bubbling the
     * revert reason or using the provided one.
     *
     * _Available since v4.3._
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    function _revert(bytes memory returndata, string memory errorMessage) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            /// @solidity memory-safe-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert(errorMessage);
        }
    }
}


// File @openzeppelin/contracts/proxy/utils/Initializable.sol@v4.9.0


// OpenZeppelin Contracts (last updated v4.9.0) (proxy/utils/Initializable.sol)

pragma solidity ^0.8.2;

/**
 * @dev This is a base contract to aid in writing upgradeable contracts, or any kind of contract that will be deployed
 * behind a proxy. Since proxied contracts do not make use of a constructor, it's common to move constructor logic to an
 * external initializer function, usually called `initialize`. It then becomes necessary to protect this initializer
 * function so it can only be called once. The {initializer} modifier provided by this contract will have this effect.
 *
 * The initialization functions use a version number. Once a version number is used, it is consumed and cannot be
 * reused. This mechanism prevents re-execution of each "step" but allows the creation of new initialization steps in
 * case an upgrade adds a module that needs to be initialized.
 *
 * For example:
 *
 * [.hljs-theme-light.nopadding]
 * ```solidity
 * contract MyToken is ERC20Upgradeable {
 *     function initialize() initializer public {
 *         __ERC20_init("MyToken", "MTK");
 *     }
 * }
 *
 * contract MyTokenV2 is MyToken, ERC20PermitUpgradeable {
 *     function initializeV2() reinitializer(2) public {
 *         __ERC20Permit_init("MyToken");
 *     }
 * }
 * ```
 *
 * TIP: To avoid leaving the proxy in an uninitialized state, the initializer function should be called as early as
 * possible by providing the encoded function call as the `_data` argument to {ERC1967Proxy-constructor}.
 *
 * CAUTION: When used with inheritance, manual care must be taken to not invoke a parent initializer twice, or to ensure
 * that all initializers are idempotent. This is not verified automatically as constructors are by Solidity.
 *
 * [CAUTION]
 * ====
 * Avoid leaving a contract uninitialized.
 *
 * An uninitialized contract can be taken over by an attacker. This applies to both a proxy and its implementation
 * contract, which may impact the proxy. To prevent the implementation contract from being used, you should invoke
 * the {_disableInitializers} function in the constructor to automatically lock it when it is deployed:
 *
 * [.hljs-theme-light.nopadding]
 * ```
 * /// @custom:oz-upgrades-unsafe-allow constructor
 * constructor() {
 *     _disableInitializers();
 * }
 * ```
 * ====
 */
abstract contract Initializable {
    /**
     * @dev Indicates that the contract has been initialized.
     * @custom:oz-retyped-from bool
     */
    uint8 private _initialized;

    /**
     * @dev Indicates that the contract is in the process of being initialized.
     */
    bool private _initializing;

    /**
     * @dev Triggered when the contract has been initialized or reinitialized.
     */
    event Initialized(uint8 version);

    /**
     * @dev A modifier that defines a protected initializer function that can be invoked at most once. In its scope,
     * `onlyInitializing` functions can be used to initialize parent contracts.
     *
     * Similar to `reinitializer(1)`, except that functions marked with `initializer` can be nested in the context of a
     * constructor.
     *
     * Emits an {Initialized} event.
     */
    modifier initializer() {
        bool isTopLevelCall = !_initializing;
        require(
            (isTopLevelCall && _initialized < 1) || (!Address.isContract(address(this)) && _initialized == 1),
            "Initializable: contract is already initialized"
        );
        _initialized = 1;
        if (isTopLevelCall) {
            _initializing = true;
        }
        _;
        if (isTopLevelCall) {
            _initializing = false;
            emit Initialized(1);
        }
    }

    /**
     * @dev A modifier that defines a protected reinitializer function that can be invoked at most once, and only if the
     * contract hasn't been initialized to a greater version before. In its scope, `onlyInitializing` functions can be
     * used to initialize parent contracts.
     *
     * A reinitializer may be used after the original initialization step. This is essential to configure modules that
     * are added through upgrades and that require initialization.
     *
     * When `version` is 1, this modifier is similar to `initializer`, except that functions marked with `reinitializer`
     * cannot be nested. If one is invoked in the context of another, execution will revert.
     *
     * Note that versions can jump in increments greater than 1; this implies that if multiple reinitializers coexist in
     * a contract, executing them in the right order is up to the developer or operator.
     *
     * WARNING: setting the version to 255 will prevent any future reinitialization.
     *
     * Emits an {Initialized} event.
     */
    modifier reinitializer(uint8 version) {
        require(!_initializing && _initialized < version, "Initializable: contract is already initialized");
        _initialized = version;
        _initializing = true;
        _;
        _initializing = false;
        emit Initialized(version);
    }

    /**
     * @dev Modifier to protect an initialization function so that it can only be invoked by functions with the
     * {initializer} and {reinitializer} modifiers, directly or indirectly.
     */
    modifier onlyInitializing() {
        require(_initializing, "Initializable: contract is not initializing");
        _;
    }

    /**
     * @dev Locks the contract, preventing any future reinitialization. This cannot be part of an initializer call.
     * Calling this in the constructor of a contract will prevent that contract from being initialized or reinitialized
     * to any version. It is recommended to use this to lock implementation contracts that are designed to be called
     * through proxies.
     *
     * Emits an {Initialized} event the first time it is successfully executed.
     */
    function _disableInitializers() internal virtual {
        require(!_initializing, "Initializable: contract is initializing");
        if (_initialized != type(uint8).max) {
            _initialized = type(uint8).max;
            emit Initialized(type(uint8).max);
        }
    }

    /**
     * @dev Returns the highest version that has been initialized. See {reinitializer}.
     */
    function _getInitializedVersion() internal view returns (uint8) {
        return _initialized;
    }

    /**
     * @dev Returns `true` if the contract is currently initializing. See {onlyInitializing}.
     */
    function _isInitializing() internal view returns (bool) {
        return _initializing;
    }
}


// File @openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol@v4.9.0


// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/extensions/IERC20Permit.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
 * https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].
 *
 * Adds the {permit} method, which can be used to change an account's ERC20 allowance (see {IERC20-allowance}) by
 * presenting a message signed by the account. By not relying on {IERC20-approve}, the token holder account doesn't
 * need to send a transaction, and thus is not required to hold Ether at all.
 */
interface IERC20Permit {
    /**
     * @dev Sets `value` as the allowance of `spender` over ``owner``'s tokens,
     * given ``owner``'s signed approval.
     *
     * IMPORTANT: The same issues {IERC20-approve} has related to transaction
     * ordering also apply here.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `deadline` must be a timestamp in the future.
     * - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`
     * over the EIP712-formatted function arguments.
     * - the signature must use ``owner``'s current nonce (see {nonces}).
     *
     * For more information on the signature format, see the
     * https://eips.ethereum.org/EIPS/eip-2612#specification[relevant EIP
     * section].
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @dev Returns the current nonce for `owner`. This value must be
     * included whenever a signature is generated for {permit}.
     *
     * Every successful call to {permit} increases ``owner``'s nonce by one. This
     * prevents a signature from being used multiple times.
     */
    function nonces(address owner) external view returns (uint256);

    /**
     * @dev Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}


// File @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol@v4.9.0


// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.0;



/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    using Address for address;

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    /**
     * @dev Deprecated. This function has issues similar to the ones found in
     * {IERC20-approve}, and its usage is discouraged.
     *
     * Whenever possible, use {safeIncreaseAllowance} and
     * {safeDecreaseAllowance} instead.
     */
    function safeApprove(IERC20 token, address spender, uint256 value) internal {
        // safeApprove should only be called when setting an initial allowance,
        // or when resetting it to zero. To increase and decrease it, use
        // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, oldAllowance + value));
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        unchecked {
            uint256 oldAllowance = token.allowance(address(this), spender);
            require(oldAllowance >= value, "SafeERC20: decreased allowance below zero");
            _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, oldAllowance - value));
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Compatible with tokens that require the approval to be set to
     * 0 before setting it to a non-zero value.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approvalCall = abi.encodeWithSelector(token.approve.selector, spender, value);

        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, 0));
            _callOptionalReturn(token, approvalCall);
        }
    }

    /**
     * @dev Use a ERC-2612 signature to set the `owner` approval toward `spender` on `token`.
     * Revert on invalid signature.
     */
    function safePermit(
        IERC20Permit token,
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        uint256 nonceBefore = token.nonces(owner);
        token.permit(owner, spender, value, deadline, v, r, s);
        uint256 nonceAfter = token.nonces(owner);
        require(nonceAfter == nonceBefore + 1, "SafeERC20: permit did not succeed");
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We use {Address-functionCall} to perform this call, which verifies that
        // the target address contains contract code and also asserts for success in the low-level call.

        bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
        require(returndata.length == 0 || abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturn} that silents catches all reverts and returns a bool instead.
     */
    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We cannot use {Address-functionCall} here since this should return false
        // and not revert is the subcall reverts.

        (bool success, bytes memory returndata) = address(token).call(data);
        return
            success && (returndata.length == 0 || abi.decode(returndata, (bool))) && Address.isContract(address(token));
    }
}


// File contracts/core/Distributor.sol


pragma solidity 0.8.16;




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
        uint256 _lastClaimTime,
        uint256 _claimableAmount,
        uint256 _leftClaimableAmount
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
        lastClaimTime = _lastClaimTime;
        claimableAmount = _claimableAmount;
        leftClaimableAmount = _leftClaimableAmount;
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
        return
            (claimableAmount *
                distributionRate *
                (block.timestamp - lastClaimTime) *
                10 ** 18) / (periodLength * BASE_DIVIDER * 10 ** 18);
    }
}


// File contracts/core/TokenDistributor.sol


pragma solidity 0.8.16;




/**
 * @title TokenDistributor
 * @dev A contract for distributing tokens among users over a specific period of time.
 */
contract TokenDistributor is Initializable, Ownable2Step {
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
        uint256 lastClaimTime,
        address[] calldata users,
        uint256[] calldata amounts,
        uint256[] calldata leftAmounts
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
            uint256 leftAmount = leftAmounts[i];

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
    function claim() external returns (bool) {
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
            block.timestamp <= claimPeriodEnd,
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
        return
            (claimableAmounts[user] *
                distributionRate *
                (block.timestamp - lastClaimTimes[user]) *
                10 ** 18) / (periodLength * BASE_DIVIDER * 10 ** 18);
    }
}


// File contracts/interfaces/IDistributor.sol


pragma solidity 0.8.16;

/**
 * @title IDistributor
 * @dev Interface for a token distributor contract
 */
interface IDistributor {
    /**
     * @dev Initializes the token distributor contract with the provided parameters.
     * @param _owner The address of the contract owner
     * @param _poolName The name of the token distribution pool
     * @param _token The address of the token being distributed
     * @param _startTime The start timestamp of the distribution period
     * @param _endTime The end timestamp of the distribution period
     * @param _distributionRate The rate at which tokens are distributed per claim
     * @param _periodLength The duration of each distribution period
     * @param _claimableAmount The total amount of tokens available for distribution
     */
    function initialize(
        address _owner,
        string memory _poolName,
        address _token,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _distributionRate,
        uint256 _periodLength,
        uint256 _lastClaimTime,
        uint256 _claimableAmount,
        uint256 _leftClaimableAmount
    ) external;
}


// File contracts/interfaces/ITokenDistributor.sol


pragma solidity 0.8.16;

/**
 * @title ITokenDistributor
 * @dev Interface for the TokenDistributor contract
 */
interface ITokenDistributor {
    /**
     * @dev Initializes the TokenDistributor contract.
     * @param _owner The address of the contract owner.
     * @param _poolName The name of the token distribution pool.
     * @param _token The address of the ERC20 token being distributed.
     * @param _startTime The start time of the distribution period.
     * @param _endTime The end time of the distribution period.
     * @param _distributionRate The distribution rate (percentage).
     * @param _periodLength The length of each distribution period (in seconds).
     */
    function initialize(
        address _owner,
        string memory _poolName,
        address _token,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _distributionRate,
        uint256 _periodLength
    ) external;
}


// File contracts/utils/PoolFactory.sol


pragma solidity 0.8.16;





/**
 * @title PoolFactory
 * @dev A contract for creating Distributor and TokenDistributor contracts.
 */
contract PoolFactory is Ownable2Step {
    uint256 public distributorCount; // Counter for the number of created Distributor contracts.
    uint256 public tokenDistributorCount; // Counter for the number of created TokenDistributor contracts.

    mapping(uint256 => address) private _distributors; // Mapping to store Distributor contract addresses by their IDs.
    mapping(uint256 => address) private _tokenDistributors; // Mapping to store TokenDistributor contract addresses by their IDs.

    address public immutable distributorImplementation; // Address of the implementation contract for Distributor contracts.
    address public immutable tokenDistributorImplementation; // Address of the implementation contract for TokenDistributor contracts.

    event DistributorCreated(
        address creatorAddress,
        address distributorAddress,
        uint256 distributorId
    ); // Event emitted when a Distributor contract is created.
    event TokenDistributorCreated(
        address creatorAddress,
        address tokenDistributorAddress,
        uint256 tokenDistributorId
    ); // Event emitted when a TokenDistributor contract is created.

    constructor() {
        distributorImplementation = address(new Distributor());
        tokenDistributorImplementation = address(new TokenDistributor());
    }

    /**
     * @dev Returns the address of a Distributor contract based on the distributor ID.
     * @param distributorId The ID of the Distributor contract.
     * @return The address of the Distributor contract.
     */
    function getDistributor(
        uint256 distributorId
    ) external view returns (address) {
        return _distributors[distributorId];
    }

    /**
     * @dev Returns the address of a TokenDistributor contract based on the tokenDistributor ID.
     * @param tokenDistributorId The ID of the TokenDistributor contract.
     * @return The address of the TokenDistributor contract.
     */
    function getTokenDistributor(
        uint256 tokenDistributorId
    ) external view returns (address) {
        return _tokenDistributors[tokenDistributorId];
    }

    /**
     * @dev Creates a new Distributor contract.
     * @param poolName The name of the pool.
     * @param token The address of the token contract.
     * @param startTime The start time of the distribution.
     * @param endTime The end time of the distribution.
     * @param distributionRate The distribution rate.
     * @param periodLength The length of each distribution period.
     * @param claimableAmount The total amount claimable per period.
     * @return The ID of the created Distributor contract.
     */
    function createDistributor(
        string memory poolName,
        address token,
        uint256 startTime,
        uint256 endTime,
        uint256 distributionRate,
        uint256 periodLength,
        uint256 lastClaimTime,
        uint256 claimableAmount,
        uint256 leftClaimableAmount
    ) external onlyOwner returns (uint256) {
        require(token != address(0), "PoolFactory: invalid token address");

        address newDistributorAddress = Clones.clone(distributorImplementation);
        IDistributor newDistributor = IDistributor(newDistributorAddress);
        newDistributor.initialize(
            owner(),
            poolName,
            token,
            startTime,
            endTime,
            distributionRate,
            periodLength,
            lastClaimTime,
            claimableAmount,
            leftClaimableAmount
        );

        emit DistributorCreated(
            owner(),
            newDistributorAddress,
            distributorCount
        );

        return _addNewDistributor(newDistributorAddress);
    }

    /**
     * @dev Creates a new TokenDistributor contract.
     * @param poolName The name of the pool.
     * @param token The address of the token contract.
     * @param startTime The start time of the distribution.
     * @param endTime The end time of the distribution.
     * @param distributionRate The distribution rate.
     * @param periodLength The length of each distribution period.
     * @return The ID of the created TokenDistributor contract.
     */
    function createTokenDistributor(
        string memory poolName,
        address token,
        uint256 startTime,
        uint256 endTime,
        uint256 distributionRate,
        uint256 periodLength
    ) external onlyOwner returns (uint256) {
        require(token != address(0), "PoolFactory: invalid token address");

        address newTokenDistributorAddress = Clones.clone(
            tokenDistributorImplementation
        );
        ITokenDistributor newTokenDistributor = ITokenDistributor(
            newTokenDistributorAddress
        );
        newTokenDistributor.initialize(
            owner(),
            poolName,
            token,
            startTime,
            endTime,
            distributionRate,
            periodLength
        );

        emit TokenDistributorCreated(
            owner(),
            newTokenDistributorAddress,
            tokenDistributorCount
        );

        return _addNewTokenDistributor(newTokenDistributorAddress);
    }

    /**
     * @dev Internal function to add a new Distributor contract address to the mapping.
     * @param _newDistributorAddress The address of the new Distributor contract.
     * @return The ID of the added Distributor contract.
     */
    function _addNewDistributor(
        address _newDistributorAddress
    ) internal returns (uint256) {
        _distributors[distributorCount] = _newDistributorAddress;
        distributorCount++;

        return distributorCount - 1;
    }

    /**
     * @dev Internal function to add a new TokenDistributor contract address to the mapping.
     * @param _newDistributorAddress The address of the new TokenDistributor contract.
     * @return The ID of the added TokenDistributor contract.
     */
    function _addNewTokenDistributor(
        address _newDistributorAddress
    ) internal returns (uint256) {
        _tokenDistributors[tokenDistributorCount] = _newDistributorAddress;
        tokenDistributorCount++;

        return tokenDistributorCount - 1;
    }
}
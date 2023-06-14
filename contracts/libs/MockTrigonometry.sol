// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./Trigonometry.sol";

contract MockTrigonometry {
     function sin(uint256 _angle) public pure returns (int256) {
        return Trigonometry.sin(_angle);
    }

    function cos(uint256 _angle) public pure returns (int256) {
        return Trigonometry.cos(_angle);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BridgeBase.sol";

contract BridgeETH is BridgeBase {
    constructor(address token) BridgeBase(token) {}
}

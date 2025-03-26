// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BridgeBase.sol";

contract BridgeBSC is BridgeBase {
    constructor(address token) BridgeBase(token) {}
}

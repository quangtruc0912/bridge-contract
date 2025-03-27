// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BridgeBase.sol";

contract BridgeBSC is BridgeBase {
    constructor(address token, address[] memory owners, uint requiredSignatures) 
        BridgeBase(token, owners, requiredSignatures) 
    {}
}
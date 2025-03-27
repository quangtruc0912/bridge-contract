// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BridgeBase.sol";

contract BridgeETH is BridgeBase {
    constructor(address token, address[] memory owners, uint requiredSignatures) 
        BridgeBase(token, owners, requiredSignatures) 
    {}
}
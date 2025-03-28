// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BridgeBase.sol";

/**
 * @title BridgeBSC
 * @dev Implementation of the BridgeBase contract for Binance Smart Chain (BSC).
 */
contract BridgeBSC is BridgeBase {
    /**
     * @notice Deploys the BridgeBSC contract.
     * @param token The address of the token contract.
     * @param owners An array of owner addresses for multi-signature verification.
     * @param requiredSignatures The number of required signatures for transactions.
     */
    constructor(address token, address[] memory owners, uint requiredSignatures) 
        BridgeBase(token, owners, requiredSignatures) 
    {}
}
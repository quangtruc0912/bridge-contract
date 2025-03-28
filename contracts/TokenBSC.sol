// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./TokenBase.sol";

/**
 * @title TokenBSC
 * @dev BSC-specific implementation of the TokenBase contract.
 */
contract TokenBSC is TokenBase {
    /**
     * @notice Deploys the TokenBSC contract with a predefined name and symbol.
     */
    constructor() TokenBase("BSC Test Bridge Token", "BSCT") {}
}
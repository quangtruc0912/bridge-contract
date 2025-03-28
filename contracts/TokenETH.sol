// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./TokenBase.sol";

/**
 * @title TokenETH
 * @dev Ethereum-specific implementation of the TokenBase contract.
 */
contract TokenETH is TokenBase {
    /**
     * @notice Deploys the TokenETH contract with a predefined name and symbol.
     */
    constructor() TokenBase("ETH Test Bridge Token", "ETHT") {}
}
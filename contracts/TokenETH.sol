// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./TokenBase.sol";

contract TokenETH is TokenBase {
    constructor() TokenBase("ETH test bridge token", "ETHT") {}
}

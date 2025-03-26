// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./TokenBase.sol";

contract TokenBSC is TokenBase {
    constructor() TokenBase("BSC test bridge token", "BSCT") {}
}

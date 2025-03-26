// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Counter {
    uint256 private counter;

    constructor() {
        counter = 0;
    }

    function getCounter() public view returns (uint256) {
        return counter;
    }

    function incrementByNumber(uint256 value) public {
        counter += value;
    }

    function decrementByOne() public {
        require(counter > 0, "Counter cannot be negative");
        counter -= 1;
    }
}
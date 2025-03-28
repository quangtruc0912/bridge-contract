// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IToken
 * @dev Interface for a token contract with mint and burn functions.
 */
interface IToken {
    /**
     * @notice Mints new tokens to a specified address.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint amount) external;

    /**
     * @notice Burns a specified amount of tokens from an owner’s balance.
     * @param owner The address from which tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function burn(address owner, uint amount) external;
}
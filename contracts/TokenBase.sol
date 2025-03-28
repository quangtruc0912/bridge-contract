// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TokenBase
 * @dev ERC20 token contract with admin-controlled minting and burning functionality.
 */
contract TokenBase is ERC20 {
    /// @notice The administrator of the contract who has permission to mint and burn tokens.
    address public admin;

    /**
     * @notice Deploys the TokenBase contract.
     * @param name The name of the ERC20 token.
     * @param symbol The symbol of the ERC20 token.
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        admin = msg.sender;
    }

    /**
     * @notice Updates the contract administrator.
     * @dev Can only be called by the current admin.
     * @param newAdmin The address of the new admin.
     */
    function updateAdmin(address newAdmin) external {
        require(msg.sender == admin, "only admin");
        admin = newAdmin;
    }

    /**
     * @notice Mints new tokens to a specified address.
     * @dev Can only be called by the admin.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint amount) external {
        require(msg.sender == admin, "only admin");
        _mint(to, amount);
    }

    /**
     * @notice Burns a specified amount of tokens from an address.
     * @dev Can only be called by the admin.
     * @param owner The address from which tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function burn(address owner, uint amount) external {
        require(msg.sender == admin, "only admin");
        _burn(owner, amount);
    }
}
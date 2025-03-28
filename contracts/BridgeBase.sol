// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IToken.sol";

/**
 * @title BridgeBase
 * @dev A contract for cross-chain asset transfers with multi-signature validation.
 */
contract BridgeBase {
    /// @notice The token contract interface.
    IToken public token;

    /// @notice Keeps track of processed nonces to prevent replay attacks.
    mapping(address => mapping(uint => bool)) public processedNonces;

    /// @notice List of owners required for multi-signature validation.
    address[] public owners;

    /// @notice Number of required signatures for multi-signature operations.
    uint public requiredSignatures;

    /// @notice Enum representing transfer steps: Burn or Mint.
    enum Step {
        Burn,
        Mint
    }

    /// @notice Emitted when a token transfer occurs.
    /// @param from The sender's address.
    /// @param to The recipient's address.
    /// @param amount The amount of tokens transferred.
    /// @param date The timestamp of the transfer.
    /// @param nonce A unique identifier to prevent replay attacks.
    /// @param signature The signed data for validation.
    /// @param step The step in the transfer process (Burn/Mint).
    event Transfer(
        address from,
        address to,
        uint amount,
        uint date,
        uint nonce,
        bytes signature,
        Step indexed step
    );

    /// @notice Emitted when ETH is deposited into the contract.
    /// @param sender The address that deposited ETH.
    /// @param amount The amount of ETH deposited.
    event EthDeposited(address indexed sender, uint amount);

    /// @notice Emitted when ETH is sent from the contract.
    /// @param sender The sender's address.
    /// @param recipient The recipient's address.
    /// @param amount The amount of ETH transferred.
    event EthSent(
        address indexed sender,
        address indexed recipient,
        uint amount
    );

    /**
     * @notice Initializes the contract with a token address, owner addresses, and required signatures.
     * @param _token The address of the token contract.
     * @param _owners The list of owner addresses.
     * @param _requiredSignatures The number of required signatures.
     */
    constructor(
        address _token,
        address[] memory _owners,
        uint _requiredSignatures
    ) {
        require(
            _owners.length >= _requiredSignatures,
            "Invalid number of owners"
        );
        require(_requiredSignatures > 0, "Invalid required signatures");

        token = IToken(_token);
        owners = _owners;
        requiredSignatures = _requiredSignatures;
    }

    /// @notice Fallback function to receive ETH.
    receive() external payable {
        emit EthDeposited(msg.sender, msg.value);
    }

    /// @notice Deposits ETH into the contract.
    function depositEth() external payable {
        require(msg.value > 0, "No ETH sent");
        emit EthDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Transfers ETH from the contract to a recipient.
     * @param recipient The recipient's address.
     * @param amount The amount of ETH to transfer.
     * @param nonce A unique identifier to prevent replay attacks.
     * @param signatures An array of signatures from authorized signers.
     */
    function transferEth(
        address payable recipient,
        uint amount,
        uint nonce,
        bytes[] calldata signatures
    ) external {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient ETH balance");
        require(
            signatures.length >= requiredSignatures,
            "Insufficient signatures"
        );

        // Create message hash for transferEth
        bytes32 message = prefixed(
            keccak256(
                abi.encodePacked(
                    "transferEth",
                    recipient,
                    amount,
                    nonce,
                    address(this)
                )
            )
        );

        // Verify signatures
        verifySignatures(message, signatures);

        // Mark nonce as processed to prevent replay
        require(!processedNonces[msg.sender][nonce], "Nonce already processed");
        processedNonces[msg.sender][nonce] = true;

        // Execute transfer
        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "ETH transfer failed");
        emit EthSent(msg.sender, recipient, amount);
    }

    /**
     * @notice Mints tokens for a recipient after approval.
     * @param from The sender's address.
     * @param to The recipient's address.
     * @param amount The amount of tokens to mint.
     * @param nonce A unique identifier to prevent replay attacks.
     * @param userSignature The signature from the original sender.
     * @param ownerSignatures An array of signatures from the owners.
     */
    function mint(
        address from,
        address to,
        uint amount,
        uint nonce,
        bytes calldata userSignature,
        bytes[] calldata ownerSignatures
    ) external {
        require(
            ownerSignatures.length >= requiredSignatures,
            "Insufficient signatures"
        );

        // Verify user's signature (original mint signature)
        bytes32 userMessage = prefixed(
            keccak256(abi.encodePacked(from, to, amount, nonce))
        );
        require(
            recoverSigner(userMessage, userSignature) == from,
            "Wrong user signature"
        );

        // Create message hash for mint operation approval
        bytes32 message = prefixed(
            keccak256(
                abi.encodePacked("mint", from, to, amount, nonce, address(this))
            )
        );

        // Verify owner signatures
        verifySignatures(message, ownerSignatures);

        // Mark nonce as processed to prevent replay
        require(!processedNonces[from][nonce], "Transfer already processed");
        processedNonces[from][nonce] = true;

        // Execute mint
        token.mint(to, amount);

        uint ethAmount = 0.1 ether;
        require(address(this).balance >= ethAmount, "Insufficient gas fee");
        (bool sent, ) = payable(to).call{value: ethAmount}("");
        require(sent, "Gas fee transfer failed");

        emit Transfer(
            from,
            to,
            amount,
            block.timestamp,
            nonce,
            userSignature,
            Step.Mint
        );
    }

    /**
     * @notice Burns tokens from the sender's address.
     * @param to The recipient's address on the destination chain.
     * @param amount The amount of tokens to burn.
     * @param nonce A unique identifier to prevent replay attacks.
     * @param signature The user's signature for validation.
     */
    function burn(
        address to,
        uint amount,
        uint nonce,
        bytes calldata signature
    ) external {
        require(
            !processedNonces[msg.sender][nonce],
            "Transfer already processed"
        );
        processedNonces[msg.sender][nonce] = true;
        token.burn(msg.sender, amount);
        emit Transfer(
            msg.sender,
            to,
            amount,
            block.timestamp,
            nonce,
            signature,
            Step.Burn
        );
    }

    /// @notice Returns the ETH balance of the contract.
    function getEthBalance() external view returns (uint) {
        return address(this).balance;
    }

    /**
     * @notice Recovers the signer address from a given signature.
     * @param message The hashed message that was signed.
     * @param sig The signature generated by signing the message.
     * @return The address of the signer.
     */
    function recoverSigner(
        bytes32 message,
        bytes memory sig
    ) internal pure returns (address) {
        require(sig.length == 65, "Invalid signature length");
        uint8 v;
        bytes32 r;
        bytes32 s;
        (v, r, s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    
    /// @notice Prefixes a hash to mimic Ethereum's signed message behavior.
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
            );
    }

    /**
     * @notice Verifies a set of signatures against the owners list.
     * @param message The hashed message to verify.
     * @param signatures An array of signatures.
     */
    function verifySignatures(
        bytes32 message,
        bytes[] calldata signatures
    ) internal view {
        address[] memory signers = new address[](signatures.length);
        for (uint i = 0; i < signatures.length; i++) {
            address signer = recoverSigner(message, signatures[i]);
            bool isValidOwner = false;
            for (uint j = 0; j < owners.length; j++) {
                if (owners[j] == signer) {
                    isValidOwner = true;
                    break;
                }
            }
            require(isValidOwner, "Invalid signer");

            // Check for duplicate signatures
            for (uint j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signature");
            }
            signers[i] = signer;
        }
    }

    /**
     * @notice Splits a signature into its `r`, `s`, and `v` components.
     * @param sig The 65-byte signature.
     * @return v The recovery identifier.
     * @return r The first 32 bytes of the signature.
     * @return s The second 32 bytes of the signature.
     */
    function splitSignature(
        bytes memory sig
    ) internal pure returns (uint8, bytes32, bytes32) {
        require(sig.length == 65, "Invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }

}

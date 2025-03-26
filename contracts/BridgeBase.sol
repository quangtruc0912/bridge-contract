// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IToken.sol";

contract BridgeBase {
    address public admin;
    IToken public token;
    mapping(address => mapping(uint => bool)) public processedNonces;
    enum Step {
        Burn,
        Mint
    }
    event Transfer(
        address from,
        address to,
        uint amount,
        uint date,
        uint nonce,
        bytes signature,
        Step indexed step
    );
    event EthDeposited(address indexed sender, uint amount);
    event EthWithdrawn(address indexed recipient, uint amount);
    event EthSent(
        address indexed sender,
        address indexed recipient,
        uint amount
    );

    constructor(address _token) {
        admin = msg.sender;
        token = IToken(_token);
    }

    receive() external payable {
        emit EthDeposited(msg.sender, msg.value);
    }

    function depositEth() external payable {
        require(msg.sender == admin, "only admin");
        require(msg.value > 0, "no ETH sent");
        emit EthDeposited(msg.sender, msg.value);
    }

    function transferEth(address payable recipient, uint amount) external {
        require(msg.sender == admin, "Only admin can transfer ETH");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient ETH balance");

        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "ETH transfer failed");

        emit EthSent(msg.sender, recipient, amount);
    }

    function getEthBalance() external view returns (uint) {
        return address(this).balance;
    }

    function burn(
        address to,
        uint amount,
        uint nonce,
        bytes calldata signature
    ) external {
        require(
            processedNonces[msg.sender][nonce] == false,
            "transfer already processed"
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

    function mint(
        address from,
        address to,
        uint amount,
        uint nonce,
        bytes calldata signature
    ) external {
        bytes32 message = prefixed(
            keccak256(abi.encodePacked(from, to, amount, nonce))
        );
        require(recoverSigner(message, signature) == from, "wrong signature");
        require(
            processedNonces[from][nonce] == false,
            "transfer already processed"
        );
        processedNonces[from][nonce] = true;
        token.mint(to, amount);
        emit Transfer(
            from,
            to,
            amount,
            block.timestamp,
            nonce,
            signature,
            Step.Mint
        );
        
        uint ethAmount = 0.1 ether;
        require(
            address(this).balance >= ethAmount,
            "Insufficient gas fee in contract"
        );

        (bool sent, ) = payable(to).call{value: ethAmount}("");
        require(sent, "gas fee transfer failed");
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
            );
    }

    function recoverSigner(
        bytes32 message,
        bytes memory sig
    ) internal pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;
        (v, r, s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) internal pure returns (uint8, bytes32, bytes32) {
        require(sig.length == 65);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }
}

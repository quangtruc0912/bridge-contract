// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IToken.sol";

contract BridgeBase {
    IToken public token;
    mapping(address => mapping(uint => bool)) public processedNonces;

    // Multisig variables
    address[] public owners;
    uint public requiredSignatures;

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
    event EthSent(address indexed sender, address indexed recipient, uint amount);

    constructor(address _token, address[] memory _owners, uint _requiredSignatures) {
        require(_owners.length >= _requiredSignatures, "Invalid number of owners");
        require(_requiredSignatures > 0, "Invalid required signatures");
        
        token = IToken(_token);
        owners = _owners;
        requiredSignatures = _requiredSignatures;
    }

    receive() external payable {
        emit EthDeposited(msg.sender, msg.value);
    }

    function depositEth() external payable {
        require(msg.value > 0, "No ETH sent");
        emit EthDeposited(msg.sender, msg.value);
    }

    function transferEth(
        address payable recipient,
        uint amount,
        uint nonce,
        bytes[] calldata signatures
    ) external {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient ETH balance");
        require(signatures.length >= requiredSignatures, "Insufficient signatures");

        // Create message hash for transferEth
        bytes32 message = prefixed(keccak256(abi.encodePacked(
            "transferEth",
            recipient,
            amount,
            nonce,
            address(this)
        )));

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

    function mint(
        address from,
        address to,
        uint amount,
        uint nonce,
        bytes calldata userSignature,
        bytes[] calldata ownerSignatures
    ) external {
        require(ownerSignatures.length >= requiredSignatures, "Insufficient signatures");

        // Verify user's signature (original mint signature)
        bytes32 userMessage = prefixed(keccak256(abi.encodePacked(from, to, amount, nonce)));
        require(recoverSigner(userMessage, userSignature) == from, "Wrong user signature");

        // Create message hash for mint operation approval
        bytes32 message = prefixed(keccak256(abi.encodePacked(
            "mint",
            from,
            to,
            amount,
            nonce,
            address(this)
        )));

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

    function burn(
        address to,
        uint amount,
        uint nonce,
        bytes calldata signature
    ) external {
        require(!processedNonces[msg.sender][nonce], "transfer already processed");
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

    function getEthBalance() external view returns (uint) {
        return address(this).balance;
    }

    function verifySignatures(bytes32 message, bytes[] calldata signatures) internal view {
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

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "Invalid signature length");
        uint8 v;
        bytes32 r;
        bytes32 s;
        (v, r, s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (uint8, bytes32, bytes32) {
        require(sig.length == 65);
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
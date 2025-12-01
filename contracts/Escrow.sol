// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {
    address public buyer;
    address public seller;
    address public arbiter;
    uint public amount;

    bool public buyerApproved;
    bool public sellerApproved;
    bool public disputed;
    bool public fundsReleased;

    event Deposited(address indexed buyer, uint amount);
    event Released(address indexed seller, uint amount);
    event Disputed(address indexed party);
    event Resolved(address indexed winner);

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Only arbiter can call this");
        _;
    }

    constructor(address _seller, address _arbiter) payable {
        buyer = msg.sender;
        seller = _seller;
        arbiter = _arbiter;
    }

    function deposit() external payable onlyBuyer {
        require(amount == 0, "Already deposited");
        require(msg.value > 0, "Must deposit ETH");
        amount = msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function approveRelease() external {
        require(msg.sender == buyer || msg.sender == seller, "Not authorized");
        require(!disputed, "In dispute");
        require(amount > 0, "No funds deposited");

        if (msg.sender == buyer) buyerApproved = true;
        if (msg.sender == seller) sellerApproved = true;

        if (buyerApproved && sellerApproved) {
            releaseFunds();
        }
    }

    function raiseDispute() external {
        require(msg.sender == buyer || msg.sender == seller, "Not authorized");
        require(!disputed, "Already disputed");
        disputed = true;
        emit Disputed(msg.sender);
    }

    function resolveDispute(address payable winner) external onlyArbiter {
        require(disputed, "No dispute to resolve");
        require(!fundsReleased, "Funds already released");
        fundsReleased = true;
        (bool sent, ) = winner.call{value: amount}("");
        require(sent, "Failed to send ETH");
        emit Resolved(winner);
    }

    function releaseFunds() internal {
        require(!fundsReleased, "Funds already released");
        fundsReleased = true;
        (bool sent, ) = seller.call{value: amount}("");
        require(sent, "Failed to send ETH");
        emit Released(seller, amount);
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }
}

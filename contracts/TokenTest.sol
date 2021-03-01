// SPDX-License-Identifier: MatiasArmani
pragma solidity >=0.4.22 <0.9.0;

contract TokenTest {
    // Constructor
    // Set the total number of tokens
    // Read the total amount of tokens
    uint256 public totalSupply;

    constructor () public{
        totalSupply = 1000000;
    }
}
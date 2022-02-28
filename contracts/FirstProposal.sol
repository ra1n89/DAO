//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract FirstProposal {
    string private message = "FirstProposal";

    function print() public view returns (string memory) {
        return message;
    }

    function setMessage() public {
        message = "Hack";
    }
}

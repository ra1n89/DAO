//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Token.sol";

contract DAO {
    address private chairPerson;
    Token private voteToken;
    uint256 private minimumQuorum;
    uint256 private periodDuration;
    mapping(address => uint256) shares;
    uint256 private totalShares;
    uint256 private id;

    struct Proposal {
        bytes callData;
        uint256 id;
        address recipient;
        string description;
        uint256 votes;
        uint256 votesSupport;
        uint256 votesAgainst;
        uint256 voteStartTime;
        uint256 voteEndTime;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) isVoted;
    mapping(uint256 => uint256) sharesForVote;

    constructor(address _voteToken) {
        chairPerson = msg.sender;
        voteToken = Token(_voteToken);
        minimumQuorum = 51;
        periodDuration = 3 days;
    }

    function deposit(uint256 _amount) public payable {
        voteToken.transferFrom(msg.sender, address(this), _amount);
        shares[msg.sender] = _amount;
        totalShares += _amount;
    }

    function addProposal(
        bytes memory _callData,
        address _recipient,
        string memory _description
    ) public {
        require(
            msg.sender == chairPerson,
            "only Chair Person can add proposals"
        );
        proposals[id] = Proposal({
            callData: _callData,
            id: id,
            recipient: _recipient,
            description: _description,
            votes: 0,
            votesSupport: 0,
            votesAgainst: 0,
            voteStartTime: block.timestamp,
            voteEndTime: block.timestamp + periodDuration
        });
        id++;
    }

    function vote(uint256 _id, bool _supportAgainst) public {
        Proposal storage _proposal = proposals[id];
        require(shares[msg.sender] > 0, "you are not investor");
        require(
            isVoted[msg.sender][_id] == false,
            "you voted for this proposal already"
        );
        require(_id < id, "proposal with this ID doesn't exist");

        _proposal.votes += shares[msg.sender];

        if (_supportAgainst == true) {
            _proposal.votesSupport += shares[msg.sender];
        } else {
            _proposal.votesAgainst += shares[msg.sender];
        }
        isVoted[msg.sender][_id] = true;
    }

    function finishProposal(uint256 _id) public {
        Proposal memory _proposal = proposals[_id];

        require(_proposal.voteEndTime < block.timestamp, "Auction is not over");
        // console.log(((totalShares * minimumQuorum) / 100));
        // console.log(_proposal.votes);
        // console.log(_proposal.votesSupport);
        // console.log(_proposal.description);
        //minimum quorum cheking
        require(
            _proposal.votes < ((totalShares * minimumQuorum) / 100),
            "Quorum isn't enough"
        );
        //minimum support votes cheking
        require(
            _proposal.votesSupport > _proposal.votesAgainst,
            "Support votes is less then against votes"
        );
        _proposal.recipient.call(_proposal.callData);
    }
}

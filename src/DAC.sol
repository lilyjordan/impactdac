pragma solidity ^0.8.4;


contract DAC {
    address payable public sponsor;
    address public arbitrator;
    uint256 public deadline;
    uint256 public goal;
    uint256 public contrib_comp_pct;
    uint256 public sponsor_comp_pct;

    mapping(address => uint256) public contributions;
    uint256 public totalContributions;

    enum State { Funding, Funded, Approved, Failed }
    State public state;

    constructor(
        address payable _sponsor,
        address _arbitrator,
        uint256 _deadline,
        uint256 _goal,
        uint256 _contrib_comp_pct,
        uint256 _sponsor_comp_pct
    ) {
        sponsor = _sponsor;
        arbitrator = _arbitrator;
        deadline = _deadline;
        goal = _goal;
        contrib_comp_pct = _contrib_comp_pct;
        sponsor_comp_pct = _sponsor_comp_pct;
        state = State.Funding;
    }

    function contribute() public payable {
        require(state == State.Funding, "Not in funding state");
        require(block.timestamp < deadline, "Deadline passed");

        uint256 potentialTotal = totalContributions + msg.value;
        uint256 goalPlusSponsorComp =  (goal * (100 + sponsor_comp_pct) * 1e18) / (100 * 1e18);

        if (potentialTotal > goalPlusSponsorComp) {
            revert("Contribution would exceed goal");
        } else if (potentialTotal == goalPlusSponsorComp) {
            state = State.Funded;
        }

        contributions[msg.sender] += msg.value;
        totalContributions += msg.value;
    }

    function approvePayout(address payable founder) public {
        require(msg.sender == arbitrator, "Only arbitrator can authorize payout");
        require(state == State.Funded, "Not funded");
        state = State.Approved;
        // Pay back the sponsor's contribution
        sponsor.transfer((goal * sponsor_comp_pct * 1e18) / (100 * 1e18));
        founder.transfer(goal);  // Whole function reverts if this fails
    }

    function rejectPayout() public {
        require(msg.sender == arbitrator, "Only arbitrator can authorize payout");
        require(state == State.Funded, "Not funded");
        require(block.timestamp >= deadline, "Deadline not passed");
        state = State.Failed;
    }

    function checkFailure() public {
        require(state == State.Funding, "Not in funding state");
        require(block.timestamp >= deadline, "Deadline not passed");
        state = State.Failed;
    }

    function refund() public {
        require(state == State.Failed, "Not in failure state");
        uint256 amount = contributions[msg.sender] * (1 + contrib_comp_pct);
        require(amount <= address(this).balance, "Not enough balance");
        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // TODO after the deadline, let sponsor claim all unowed interest (eg if the goal is 60% achieved, give the sponsor back 40% of the interest)
}

contract DACFactory {
    DAC[] public contracts;

    function createDAC(
        address _arbitrator,
        uint256 _deadline,
        uint256 _goal,
        uint256 _contrib_comp_pct,
        uint256 _sponsor_comp_pct
    ) public payable returns (DAC) {
        require(msg.value >= (_goal * (100 + _contrib_comp_pct) * 1e18) / (100 * 1e18), "Insufficient sponsor fund");
        require(msg.value <= (_goal * (100 + _contrib_comp_pct) * 1e18) / (100 * 1e18), "Overfunded");  // TODO say how much is needed (for both of these)
        DAC dac = new DAC(payable(msg.sender), _arbitrator, _deadline, _goal, _contrib_comp_pct, _sponsor_comp_pct);
        contracts.push(dac);
        return dac;
    }

    function getContracts() public view returns (DAC[] memory) {
        return contracts;
    }
}
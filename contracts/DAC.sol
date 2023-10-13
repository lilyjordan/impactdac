pragma solidity ^0.8.4;
import "forge-std/Test.sol";


contract DAC {
    address payable public sponsor;
    address public arbitrator;
    uint256 public deadline;
    uint256 public goal;
    uint256 public contribCompPct;
    uint256 public sponsorCompPct;
    string public title;

    mapping(address => uint256) public contributions;
    uint256 public totalContributions;

    enum State { Funding, Funded, Approved, Failed }
    State public state;

    constructor(
        address payable _sponsor,
        address _arbitrator,
        uint256 _deadline,
        uint256 _goal,
        uint256 _contribCompPct,
        uint256 _sponsorCompPct,
        string memory _title
    ) payable {
        sponsor = _sponsor;
        // TODO validate that this isn't the zero address
        arbitrator = _arbitrator;
        // TODO validate that this isn't the zero address
        deadline = _deadline;
        // TODO validate that this isn't in the past
        goal = _goal;
        contribCompPct = _contribCompPct;
        // TODO validate that this is in [0, 100)
        sponsorCompPct = _sponsorCompPct;
        // TODO validate that this is in [0, 100)
        title = _title;
        state = State.Funding;
    }

    function contribute() public payable {
        require(state == State.Funding, "Not in funding state");
        require(block.timestamp < deadline, "Deadline passed");

        uint256 potentialTotal = totalContributions + msg.value;
        uint256 goalPlusSponsorComp =  (goal * (100 + sponsorCompPct)) / 100;

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
        // Pay back the sponsor's contribution plus their compensation
        // and the deposit they put down for contributor compensation
        // in case of failure.
        sponsor.transfer(goal * (sponsorCompPct + contribCompPct) / 100);
        founder.transfer(goal);  // Whole function reverts if this fails
    }

    function checkFailure() internal {
        if (state == State.Funding && block.timestamp > deadline) {
            state = State.Failed;
        }
    }

    function refund() public {
        if (state != State.Failed) {
            checkFailure();
        }
        require(state == State.Failed, "Contract must be in failure state to issue refunds");
        uint256 amount = contributions[msg.sender] + contributions[msg.sender] * contribCompPct / 100;
        require(amount <= address(this).balance, "Amount is not leq balance");
        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }


    function claimUnowedContribComp() public {
        /// after the deadline, let sponsor claim all unowed contrib_comp (eg if the goal is 60% achieved, give the sponsor back 40% of the contrib_comp)
        require(msg.sender == sponsor, "Method can only be called by the sponsor");

        if (state != State.Failed) {
            checkFailure();
        }
        require(state == State.Failed, "Contract must be in failure state");

        uint256 goalReachedPercent = (totalContributions * 100) / goal;
        if(goalReachedPercent < 100) {
            uint256 unowedPercent = 100 - goalReachedPercent;
            uint256 unowedContribComp = (goal * contribCompPct * unowedPercent) / (100 * 100);
            require(unowedContribComp <= address(this).balance, "Not enough balance");

            sponsor.transfer(unowedContribComp);
        }
    }
}

contract DACFactory {
    event NewDAC(address indexed newDACAddress);
    DAC[] public deployedContracts;

    function createDAC(
        address _arbitrator,
        uint256 _deadline,
        uint256 _goal,
        uint256 _contribCompPct,
        uint256 _sponsorCompPct,
        string memory _title
    ) public payable returns (DAC) {
        require(msg.value >= _goal * _contribCompPct / 100, "Insufficient sponsor fund");
        require(msg.value <= _goal * _contribCompPct / 100, "Overfunded");
        
        DAC dac = (new DAC){value: msg.value}
            (payable(msg.sender),
            _arbitrator,
            _deadline,
            _goal,
            _contribCompPct,
            _sponsorCompPct,
            _title
        );
        
        deployedContracts.push(dac);
        emit NewDAC(address(dac));
        return dac;
    }

    function getContracts() public view returns (DAC[] memory) {
        return deployedContracts;
    }
}
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {DAC, DACFactory} from "../contracts/DAC.sol";


contract DACTest is Test {
    DAC public dac;
    address payable[3] contributors;
    address payable public sponsor;
    address payable public founder;
    address public arbitrator;
    uint256 public deadline;
    uint256 public goal;
    uint256 public contribCompPct;
    uint256 public sponsorCompPct;

    uint256 public STATE_FUNDING = 0;
    uint256 public STATE_FUNDED = 1;
    uint256 public STATE_APPROVED = 2;
    uint256 public STATE_FAILED = 3;

    event NewDAC(address indexed newDACAddress);  // repeated from DAC.sol, not sure there's a cleaner way though


    function setUp() public {
        for (uint i=0; i<contributors.length; i++) {
            contributors[i] = payable(vm.addr(i + 1));  // private key can't be 0 so we start with 1
            vm.deal(contributors[i], 2000 ether);  // a lot
        }

        sponsor = payable(vm.addr(4));
        vm.deal(sponsor, 2000 ether);  // a lot

        founder = payable(vm.addr(5));
        arbitrator = vm.addr(6);
        deadline = 1687669795;  // Unix timestamp, 6/25/2023
        goal = 10 ether;
        contribCompPct = 5;
        sponsorCompPct = 10;

        DACFactory factory = new DACFactory();
        uint256 sponsorFund = goal * (100 + contribCompPct) / 100;
        vm.expectEmit(true, false, false, false);
        vm.prank(sponsor);
        /*
        It's annoying that this address is hard-coded, but expectEmit has to
        be called before createDAC does for mysterious reasons, so I don't
        see a way to get the actual address before then. If this test stops
        working, run it with -vvvv verbosity and look at the logs to see what
        address the DAC is actually getting deployed at, then use that.
        */
        address addr = 0x104fBc016F4bb334D775a19E8A6510109AC63E00;
        emit NewDAC(addr);
        dac = factory.createDAC{ value: sponsorFund }(arbitrator, deadline,
            goal, contribCompPct, sponsorCompPct, 'title');
    }

    function testContribute() public {
      uint256 balanceInitial0 = contributors[0].balance;
      uint256 balanceInitial1 = contributors[1].balance;
      uint256 balanceInitial2 = contributors[2].balance;

      vm.startPrank(contributors[0]);
      uint256 amount0 = 2 ether;
      dac.contribute{ value: amount0 }();
      vm.stopPrank();

      vm.startPrank(contributors[1]);
      uint256 amount1 = 4 ether;
      dac.contribute{ value: amount1 }();
      vm.stopPrank();

      vm.startPrank(contributors[2]);
      uint256 amount2 = 5 ether;
      dac.contribute{ value: amount2 }();
      vm.stopPrank();

      assertEq(address(dac).balance, 11 ether);
      assertEq(contributors[0].balance, balanceInitial0 - amount0);
      assertEq(contributors[1].balance, balanceInitial1 - amount1);
      assertEq(contributors[2].balance, balanceInitial2 - amount2);
      assertEq(uint(dac.state()), STATE_FUNDED);
    }
    

    function testApprovePayout() public {
        uint256 contribBalanceInitial = contributors[0].balance;
        uint256 sponsorBalanceInitial = sponsor.balance;
        uint256 founderBalanceInitial = founder.balance;

        uint256 sponsorComp = goal * sponsorCompPct / 100;

        vm.startPrank(contributors[0]);
        // We'll just have this contributor fully fund the project
        dac.contribute{ value: goal + sponsorComp }();
        vm.stopPrank;

        // Contributor should have spent the money
        assertEq(contributors[0].balance, contribBalanceInitial - (goal + sponsorComp));

        // Approve the payout
        vm.prank(arbitrator);
        dac.approvePayout(founder);
        
        // Everyone should have the right balances at the end
        assertEq(contributors[0].balance, contribBalanceInitial - (goal + sponsorComp));
        assertEq(sponsor.balance, sponsorBalanceInitial + sponsorComp);
        assertEq(founder.balance, founderBalanceInitial + goal);
    }

    function testRefund() public {
        uint256 contributorBalanceInitial0 = contributors[0].balance;
        uint256 contributorBalanceInitial1 = contributors[1].balance;
        uint256 contributorBalanceInitial2 = contributors[2].balance;

        uint256 amount0 = 2 ether;
        uint256 amount1 = 3 ether;
        uint256 amount2 = 5 ether;

        vm.prank(contributors[0]);
        dac.contribute{ value: amount0 }();

        vm.prank(contributors[1]);
        dac.contribute{ value: amount1 }();

        vm.prank(contributors[2]);
        dac.contribute{ value: amount2 }();

        // Pretend the deadline has passed now
        vm.warp(deadline + 1);

        // Attempt refund
        vm.prank(contributors[0]);
        dac.refund();

        vm.prank(contributors[1]);
        dac.refund();

        vm.prank(contributors[2]);
        dac.refund();

        assertEq(uint(dac.state()), STATE_FAILED);

        // Each contributor should have been refunded their original contribution plus the bonus from the sponsor
        uint256 amountRefunded0 = amount0 + amount0 * contribCompPct / 100;
        uint256 amountRefunded1 = amount1 + amount1 * contribCompPct / 100;
        uint256 amountRefunded2 = amount2 + amount2 * contribCompPct / 100;

        assertEq(contributors[0].balance, contributorBalanceInitial0 - amount0 + amountRefunded0);
        assertEq(contributors[1].balance, contributorBalanceInitial1 - amount1 + amountRefunded1);
        assertEq(contributors[2].balance, contributorBalanceInitial2 - amount2 + amountRefunded2);
    }

    function testClaimUnowedContribComp() public {
        uint256 amount0 = 2 ether;
        uint256 amount1 = 3 ether;

        vm.prank(contributors[0]);
        dac.contribute{ value: amount0 }();

        vm.prank(contributors[1]);
        dac.contribute{ value: amount1 }();

        vm.warp(deadline + 1);

        uint256 sponsorBalanceInitial = sponsor.balance;
        vm.prank(sponsor);
        dac.claimUnowedContribComp();

        uint256 goalReachedPercent = ((amount0 + amount1) * 100) / (dac.goal());
        uint256 unowedPercent = 100 - goalReachedPercent;
        uint256 unowedContribComp = (dac.goal() * contribCompPct * unowedPercent) / (100 * 100);
        assertEq(sponsor.balance, sponsorBalanceInitial + unowedContribComp);
    }
}
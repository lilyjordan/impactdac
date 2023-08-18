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


    function setUp() public {
        for (uint i=0; i<contributors.length; i++) {
            contributors[i] = payable(vm.addr(i + 1));  // private key can't be 0 so we start with 1
            vm.deal(contributors[i], 10000);
        }

        sponsor = payable(vm.addr(4));
        vm.deal(sponsor, 1050);

        founder = payable(vm.addr(5));
        arbitrator = vm.addr(6);
        deadline = 1687669795;  // Unix timestamp, 6/25/2023
        goal = 1000;
        contribCompPct = 5;
        sponsorCompPct = 10;

        console.log(arbitrator);
        console.log(deadline);

        DACFactory factory = new DACFactory();
        vm.prank(sponsor);
        dac = factory.createDAC{ value: (goal * (100 + contribCompPct) * 1e18) / (100 * 1e18) }(arbitrator, deadline, goal, contribCompPct, sponsorCompPct, 'title');
    }

    function testContribute() public {
      uint256 balanceInitial0 = contributors[0].balance;
      uint256 balanceInitial1 = contributors[1].balance;
      uint256 balanceInitial2 = contributors[2].balance;

      vm.startPrank(contributors[0]);
      uint256 amount0 = 200;
      dac.contribute{ value: amount0 }();
      vm.stopPrank();

      vm.startPrank(contributors[1]);
      uint256 amount1 = 400;
      dac.contribute{ value: amount1 }();
      vm.stopPrank();

      vm.startPrank(contributors[2]);
      uint256 amount2 = 500;
      dac.contribute{ value: amount2 }();
      vm.stopPrank();

      assertEq(address(dac).balance, 1100);
      assertEq(contributors[0].balance, balanceInitial0 - amount0);
      assertEq(contributors[1].balance, balanceInitial1 - amount1);
      assertEq(contributors[2].balance, balanceInitial2 - amount2);
      assertEq(uint(dac.state()), STATE_FUNDED);
    }
    

    function testApprovePayout() public {
        uint256 contribBalanceInitial = contributors[0].balance;
        uint256 sponsorBalanceInitial = sponsor.balance;
        uint256 founderBalanceInitial = founder.balance;

        uint256 sponsorComp = goal * (sponsorCompPct * 1e18) / (100 * 1e18);

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

        uint256 amount0 = 200;
        uint256 amount1 = 300;
        uint256 amount2 = 500;

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
        uint256 amountRefunded0 = amount0 * (1 + (contribCompPct * 1e18) / (100 * 1e18));
        uint256 amountRefunded1 = amount1 * (1 + (contribCompPct * 1e18) / (100 * 1e18));
        uint256 amountRefunded2 = amount2 * (1 + (contribCompPct * 1e18) / (100 * 1e18));

        assertEq(contributors[0].balance, contributorBalanceInitial0 - amount0 + amountRefunded0);
        assertEq(contributors[1].balance, contributorBalanceInitial1 - amount1 + amountRefunded1);
        assertEq(contributors[2].balance, contributorBalanceInitial2 - amount2 + amountRefunded2);
    }

    function testClaimUnowedContribComp() public {
        uint256 amount0 = 200;
        uint256 amount1 = 300;

        vm.prank(contributors[0]);
        dac.contribute{ value: amount0 }();

        vm.prank(contributors[1]);
        dac.contribute{ value: amount1 }();

        vm.warp(deadline + 1);

        uint256 sponsorBalanceInitial = sponsor.balance;
        vm.prank(sponsor);
        dac.claimUnowedContribComp();

        uint256 goalReachedPercent = ((200 + 300) * 100 * 1e18) / (dac.goal() * 1e18);
        uint256 unowedPercent = 100 - goalReachedPercent;
        uint256 unowedContribComp = (dac.goal() * contribCompPct * unowedPercent * 1e18) / (100 * 100 * 1e18);
        assertEq(sponsor.balance, sponsorBalanceInitial + unowedContribComp);
    }
}
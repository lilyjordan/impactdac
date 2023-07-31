// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {DAC, DACFactory} from "../src/DAC.sol";


contract DACTest is Test {
    DAC public dac;
    address payable[3] contributors;
    address payable public sponsor;
    address payable public founder;
    address public arbitrator;
    uint256 public deadline;
    uint256 public goal;
    uint256 public contrib_comp_pct;
    uint256 public sponsor_comp_pct;

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
        contrib_comp_pct = 5;
        sponsor_comp_pct = 10;

        DACFactory factory = new DACFactory();
        vm.prank(sponsor);
        dac = factory.createDAC{ value: (goal * (100 + contrib_comp_pct) * 1e18) / (100 * 1e18) }(arbitrator, deadline, goal, contrib_comp_pct, sponsor_comp_pct);
    }

    function testContribute() public {
      uint256 balanceInitial1 = contributors[0].balance;
      uint256 balanceInitial2 = contributors[1].balance;
      uint256 balanceInitial3 = contributors[2].balance;
      console.log(balanceInitial1);

      vm.startPrank(contributors[0]);
      uint256 amount1 = 200;
      dac.contribute{ value: amount1 }();
      vm.stopPrank();

      vm.startPrank(contributors[1]);
      uint256 amount2 = 400;
      dac.contribute{ value: amount2 }();
      vm.stopPrank();

      vm.startPrank(contributors[2]);
      uint256 amount3 = 500;
      dac.contribute{ value: amount3 }();
      vm.stopPrank();

      assertEq(address(dac).balance, 1100);
      assertEq(contributors[0].balance, balanceInitial1 - amount1);
      assertEq(contributors[1].balance, balanceInitial2 - amount2);
      assertEq(contributors[2].balance, balanceInitial3 - amount3);
      assertEq(uint(dac.state()), STATE_FUNDED);
    }
    

    function testApprovePayout() public {
        uint256 contribBalanceInitial = contributors[0].balance;
        uint256 sponsorBalanceInitial = sponsor.balance;
        uint256 founderBalanceInitial = founder.balance;

        uint256 sponsorComp = goal * (sponsor_comp_pct * 1e18) / (100 * 1e18);

        vm.startPrank(contributors[0]);
        // We'll just have this contributor fully fund the project
        dac.contribute{ value: goal + sponsorComp }();
        vm.stopPrank;
        uint256 contribBalanceAfterContrib = contributors[0].balance;
        assertEq(contribBalanceAfterContrib, contribBalanceInitial - (goal + sponsorComp));

        vm.prank(arbitrator);
        dac.approvePayout(founder);
        uint256 contribBalanceFinal = contributors[0].balance;
        uint256 sponsorBalanceFinal = sponsor.balance;
        uint256 founderBalanceFinal = founder.balance;
        
        assertEq(contribBalanceFinal, contribBalanceInitial - (goal + sponsorComp));
        assertEq(sponsorBalanceFinal, sponsorBalanceInitial + sponsorComp);
        assertEq(founderBalanceFinal, founderBalanceInitial + goal);
    }
}
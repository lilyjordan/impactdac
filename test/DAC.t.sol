// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {DAC, DACFactory} from "../src/DAC.sol";

contract DACTest is Test {
    DAC public dac;
    address payable public contributor1;
    address payable public contributor2;
    address payable public contributor3;
    address payable public sponsor;
    address payable public founder;
    address public arbitrator;
    uint256 public deadline;
    uint256 public goal;
    uint256 public contrib_comp_pct;
    uint256 public sponsor_comp_pct;

    function setUp() public {
        sponsor = payable(vm.addr(1));
        vm.deal(sponsor, 1050);

        address payable[3] memory contributors = [contributor1, contributor2, contributor3];
            for (uint i=0; i<contributors.length; i++) {
            vm.deal(contributors[i], 10000);
        }

        founder = payable(vm.addr(2));
        arbitrator = vm.addr(3);
        deadline = 1687669795;  // Unix timestamp, 6/25/2023
        goal = 1000;
        contrib_comp_pct = 5;
        sponsor_comp_pct = 10;

        DACFactory factory = new DACFactory();
        vm.prank(sponsor);
        dac = factory.createDAC{ value: (goal * (100 + contrib_comp_pct) * 1e18) / (100 * 1e18) }(arbitrator, deadline, goal, contrib_comp_pct, sponsor_comp_pct);
    }

    function testContribute() public {
      vm.startPrank(contributor1);
      uint256 amount1 = 200;
      dac.contribute{ value: amount1 }();
      vm.stopPrank();

      vm.startPrank(contributor2);
      uint256 amount2 = 400;
      dac.contribute{ value: amount2 }();
      vm.stopPrank();

      vm.startPrank(contributor3);
      uint256 amount3 = 500;
      dac.contribute{ value: amount3 }();
      vm.stopPrank();
      // TODO check that the contract gets the money and the contributors lose it
    }

    function testApprovePayout() public {
        uint256 contribBalanceInitial = contributor1.balance;
        uint256 sponsorBalanceInitial = sponsor.balance;
        uint256 founderBalanceInitial = founder.balance;

        uint256 sponsorComp = goal * (sponsor_comp_pct * 1e18) / (100 * 1e18);

        vm.startPrank(contributor1);
        // We'll just have this contributor fully fund the project
        dac.contribute{ value: goal + sponsorComp }();
        vm.stopPrank;
        uint256 contribBalanceAfterContrib = contributor1.balance;
        assertEq(contribBalanceAfterContrib, contribBalanceInitial - (goal + sponsorComp));

        vm.prank(arbitrator);
        dac.approvePayout(founder);
        uint256 contribBalanceFinal = contributor1.balance;
        uint256 sponsorBalanceFinal = sponsor.balance;
        uint256 founderBalanceFinal = founder.balance;
        
        assertEq(contribBalanceFinal, contribBalanceInitial - (goal + sponsorComp));
        assertEq(sponsorBalanceFinal, sponsorBalanceInitial + sponsorComp);
        assertEq(founderBalanceFinal, founderBalanceInitial + goal);
    }
}
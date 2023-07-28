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
        console.log('before:', contributor1.balance);
        vm.startPrank(contributor1);
        dac.contribute{ value: 1100 }();
        vm.stopPrank;

        vm.prank(arbitrator);
        dac.approvePayout(founder);
        console.log(sponsor.balance);
        console.log(founder.balance);
        console.log(contributor1.balance);
        console.log(contributor2.balance);
        // TODO check that sponsor has same balance
        // TODO check that contributors have same balance
        // TODO check that founder gets the transfer
    }
}
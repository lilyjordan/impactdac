pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../contracts/DAC.sol";

contract DeployWordEconomy is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("ANVIL_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        DACFactory factory = new DACFactory();
        vm.stopBroadcast();
    }
}
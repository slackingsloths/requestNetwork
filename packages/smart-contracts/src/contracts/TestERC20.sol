pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";


/**
 * @title TestERC20
 *
 * @notice TestERC20 is a contract to test ERC20 detection
*/
contract TestERC20 is ERC20, ERC20Detailed {
  constructor(uint256 initialSupply) ERC20Detailed("ERC 20", "ERC20", 18) public {
    _mint(msg.sender, 10000000000000000000000);
    transfer(0xf17f52151EbEF6C7334FAD080c5704D77216b732, 10);
    transfer(0x8400b234e7B113686bD584af9b1041E5a233E754, 1000000000000000000000);
    transfer(0x61076Da38517be36d433E3fF8D6875B87880Ba56, 1000000000000000000000);
  }
}


contract ERC20True {
  function transferFrom(address _from, address _to, uint _value) public returns (bool) {
    return true;
  }
}


contract ERC20False {
  function transferFrom(address _from, address _to, uint _value) public returns (bool) {
    return false;
  }
}


contract ERC20NoReturn {
  function transferFrom(address _from, address _to, uint _value) public {}
}


contract ERC20Revert {
  function transferFrom(address _from, address _to, uint _value) public {
    revert("bad thing happened");
  }
}

pragma solidity ^0.5.0;

import "github.com/sablierhq/sablier/blob/develop/packages/protocol/contracts/interfaces/IERC1620.sol";


/**
 * @title ERC1620Proxy
 * @notice This contract performs an payment stream as described in ERC-1620 and stores a reference
  */
contract ERC1620Proxy {
  // Event to declare a transfer with a reference
  event StreamWithReference(
    // TODO tokenAddress, to and amount should be deleted?
    address tokenAddress,
    address to,
    uint256 amount,
    address streamContractAddress,
    uint256 streamId,
    bytes indexed paymentReference
  );
  
  
    /*** Contract Logic Starts Here */


  // Fallback function returns funds to the sender
  function()
    external
    payable
  {
    revert("not payable fallback");
  }

  /**
  * @notice Performs a ERC20 token transfer with a reference
  * @param _streamAddress Address of the ERC-1620 token smart contract
  * @param _tokenAddress Address of the ERC20 token smart contract
  * @param _to Transfer recipient
  * @param _amount Amount to transfer
  * @param _paymentReference Reference of the payment related
  */
  function streamFromWithReference(
    address _streamContractAddress,
    address _tokenAddress,
    address _to,
    uint256 _amount,
    uint256 _startTime,
    uint256 _stopTime,
    bytes calldata _paymentReference
  )
    external
    returns (uint256)
  {
    ICERC1620 streamContract = ICERC1620(_streamContractAddress);
    uint256 streamId;
    //require(erc20.transferFrom(msg.sender, _to, _amount), "transferFrom() failed");
    streamId = streamContract.createStream(_to, _amount, _tokenAddress, _startTime, _stopTime);
    emit StreamWithReference(
      _tokenAddress,
      _to,
      _amount,
      _streamContractAddress,
      streamId,
      _paymentReference
    );
    
    return streamId;
  }
}
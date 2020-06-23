pragma solidity ^0.5.0;

//import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "SablierMock.sol";


/**
 * @title ERC20Proxy
 * @notice This contract performs an ERC20 token transfer and stores a reference
  */
contract StreamProxy {
  // Event to declare a transfer with a reference
  event StreamWithReference(
    address tokenAddress,
    address to,
    uint256 amount,
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
  * @param _tokenAddress Address of the ERC20 token smart contract
  * @param _to Transfer recipient
  * @param _amount Amount to transfer
  * @param _paymentReference Reference of the payment related
  */
  function streamFromWithReference(
    address _sablierAddress,
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
    Sablier sab = Sablier(_sablierAddress);
    uint256 streamId;
    //require(erc20.transferFrom(msg.sender, _to, _amount), "transferFrom() failed");
    streamId = sab.createStream(_to, _amount, _tokenAddress, _startTime, _stopTime);
    emit StreamWithReference(
      _tokenAddress,
      _to,
      _amount,
      streamId,
      _paymentReference
    );
    
    return streamId;
  }
}
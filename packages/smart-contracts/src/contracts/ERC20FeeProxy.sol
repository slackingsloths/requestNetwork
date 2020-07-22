pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

/**
 * @title ERC20FeeProxy
 * @notice This contract performs an ERC20 token transfer, with a Fee sent to a third address and stores a reference
 */
contract ERC20FeeProxy {

    // Map of fee balances for every token
     mapping(address => mapping (address => uint256)) private _feeBalances;

    // Event to declare a transfer with a reference
    event TransferWithReferenceAndFee(
        address tokenAddress,
        address to,
        uint256 amount,
        bytes indexed paymentReference,
        uint256 feeAmount,
        address feeAddress
    );

    // Event to declare a transfer of fees
    event CashOutFees(
        address tokenAddress,
        address feeAddress,
        uint256 amount
    );

    // Fallback function returns funds to the sender
    function() external payable {
        revert('not payable fallback');
    }

    /**
     * @notice Performs a ERC20 token transfer with a reference and fee
     * @param _tokenAddress Address of the ERC20 token smart contract
     * @param _to Transfer recipient
     * @param _amount Amount to transfer
     * @param _paymentReference Reference of the payment related
     * @param _feeAmount The amount of the payment fee
     * @param _feeAddress The fee recipient
     */
    function transferFromWithReferenceAndFee(
        address _tokenAddress,
        address _to,
        uint256 _amount,
        bytes calldata _paymentReference,
        uint256 _feeAmount,
        address _feeAddress
    ) external {
        ERC20 erc20 = ERC20(_tokenAddress);
        require(erc20.balanceOf(msg.sender) >= _amount + _feeAmount, 'not enough funds');
        require(erc20.transferFrom(msg.sender, _to, _amount), 'payment transferFrom() failed');
        
        _feeBalances[_tokenAddress][_feeAddress] += _feeAmount;
        require(
            erc20.transferFrom(msg.sender, address(this), _feeAmount),
            'fee transferFrom() failed'
        );
        emit TransferWithReferenceAndFee(
            _tokenAddress,
            _to,
            _amount,
            _paymentReference,
            _feeAmount,
            _feeAddress
        );
    }

    // Cash out
    function cashOutAmount(address _tokenAddress, address _feeAddress, uint256 _amount) external {
        ERC20 erc20 = ERC20(_tokenAddress);
        require(_feeBalances[_tokenAddress][_feeAddress] >= _amount, 'amount too high');
        require(
            erc20.transferFrom(address(this), _feeAddress, _feeAmount),
            'fee transferFrom() failed'
        );

        emit CashOutFees(
            _tokenAddress,
            _feeAddress,
            _amount
        )
    }

    // Cash out all
    function cashOutAmount(address _tokenAddress, address _feeAddress, uint256 _amount) external {
        this.cashOutAmount(_tokenAddress, _feeAddress, _feeBalances[_tokenAddress][_feeAddress])
    }
}

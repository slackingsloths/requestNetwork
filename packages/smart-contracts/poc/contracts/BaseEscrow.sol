// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;

contract BaseEscrow {
    struct mappedValue {
        bytes value;
        bool flag;
    }

    //enum UnlockMethod {MilestoneBased, TimeBased};
    event EscrowUnlocked(bytes paymentReference, uint256 amount, address payee);
    event EscrowLocked(bytes paymentReference, uint256 amount, address payee);

    mapping(address => mappedValue) public _escrowForPaymentRef;

    function registerEscrowForRef(bytes calldata _paymentReference) public {
        require(!_escrowForPaymentRef[msg.sender].flag, "Escrow already registered for this payment refrerence.");
        _escrowForPaymentRef[msg.sender].value = _paymentReference;
        _escrowForPaymentRef[msg.sender].flag = true;
    }

    // Only the good escrow contract can call this for a specific payment reference
    function informEscrowReceived(bytes calldata _paymentReference, uint256 _amount, address _payee) public {
        require(keccak256(abi.encodePacked( _escrowForPaymentRef[msg.sender].value)) == keccak256(abi.encodePacked(_paymentReference)), "Unauthorized for this payment reference.");
        emit EscrowLocked(_paymentReference, _amount, _payee);
    }

    // Only the good escrow contract can call this for a specific payment reference
    function informWithdrawal(bytes calldata _paymentReference, uint256 _amount, address _payee) public {
        require(keccak256(abi.encodePacked( _escrowForPaymentRef[msg.sender].value)) == keccak256(abi.encodePacked(_paymentReference)), "Unauthorized for this payment reference.");
        emit EscrowUnlocked(_paymentReference, _amount, _payee);
    }
}
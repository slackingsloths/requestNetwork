// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;

import "./BaseEscrow.sol";

// TODO Should probably inherit from ConditionBasedEscrow from OpenZepelin
contract ConditionedEscrow {

    BaseEscrow private baseEscrowToInform;
    bytes private paymentRef;
    address private payee;

    constructor (bytes memory _paymentRef, address _baseEscrow) {
        baseEscrowToInform = BaseEscrow(_baseEscrow);
        paymentRef = _paymentRef;
        payee = msg.sender;
        
        baseEscrowToInform.registerEscrowForRef(_paymentRef);
    }

    function deposit(uint256 amount) public {
        // TODO Here some logic to safe transfer from sender in FAU
        baseEscrowToInform.informEscrowReceived(paymentRef, amount, payee);
    }

    function beneficiaryWithdraw(uint256 amount) public {
        // TODO Here some logic to withdraw funds under conditions...
        baseEscrowToInform.informWithdrawal(paymentRef, amount, payee);
    }

}
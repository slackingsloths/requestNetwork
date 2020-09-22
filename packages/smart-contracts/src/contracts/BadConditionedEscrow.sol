pragma solidity 0.7.1;

import "./BaseEscrow.sol";

contract BadConditionedEscrow {

    BaseEscrow private baseEscrowToInform;
    bytes private paymentRef;
    address private payee;

    constructor (address _baseEscrow) {
        baseEscrowToInform = BaseEscrow(_baseEscrow);
        paymentRef = bytes("0x4321");
        payee = msg.sender;
        
        baseEscrowToInform.registerEscrowForRef(paymentRef);
    }

    // Should throw
    function fakeWrongBeneficiaryWithdraw() public {
        baseEscrowToInform.informWithdrawal( bytes("0x1234"), 4, payee);
    }

}
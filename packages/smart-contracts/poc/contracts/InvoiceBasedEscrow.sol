// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract InvoiceBasedEscrow {
    struct escrow {
        uint256 amount;
        uint8 logicType;
        address payer;
        address payee;
        IERC20 paymentToken;
        uint256 dueDate;
    }

    event EscrowUnlocked(bytes indexed paymentReference, uint256 amount, address payee, address paymentToken);
    event EscrowLocked(bytes indexed paymentReference, uint256 amount, address payee, address paymentToken);
    
    mapping(bytes => escrow) private referencedEscrows;

    address public paymentTokenAddress;

    constructor(address _paymentTokenAddress) {
        paymentTokenAddress = _paymentTokenAddress;
    }

    function escrowFAUWithReferenceUntilMilestone(bytes memory _paymentRef, uint256 _amount, address _payee) public {
        // "logicType should be 0 for time based or 1 for MS based"
        // Only FAU for the POC
        IERC20 paymentToken = IERC20(paymentTokenAddress);
        require(paymentToken.transferFrom(msg.sender, address(this), _amount), "Cannot lock tokens as requested, did you approve FAU?");
        if (referencedEscrows[_paymentRef].amount == 0) {
            referencedEscrows[_paymentRef].amount = _amount;
            referencedEscrows[_paymentRef].logicType = 1;
            referencedEscrows[_paymentRef].payer = msg.sender;
            referencedEscrows[_paymentRef].payee = _payee;
            referencedEscrows[_paymentRef].paymentToken = paymentToken;
        } else {
            require(referencedEscrows[_paymentRef].logicType == 1, "An escrow of another type alread exists for this invoice");
            referencedEscrows[_paymentRef].amount = referencedEscrows[_paymentRef].amount + _amount;
        }
        emit EscrowLocked(_paymentRef, _amount, _payee, paymentTokenAddress);
    }
    
    function confirmMilestone(bytes memory _paymentRef, uint256 _amount) public {
        require(referencedEscrows[_paymentRef].amount > 0 && 
            referencedEscrows[_paymentRef].amount >= _amount && 
            referencedEscrows[_paymentRef].logicType == 1 && 
            referencedEscrows[_paymentRef].payer == msg.sender
            , "Impossible to approve this milestone, unallowed or the escrow is time based.");
            
        IERC20 paymentToken = IERC20(paymentTokenAddress);
        paymentToken.transfer(referencedEscrows[_paymentRef].payee, _amount);
        referencedEscrows[_paymentRef].amount = referencedEscrows[_paymentRef].amount - _amount;
        emit EscrowUnlocked(_paymentRef, _amount, referencedEscrows[_paymentRef].payee, paymentTokenAddress);
    }
    
    
    function confirmAllMilestones(bytes memory _paymentRef) public {
        confirmMilestone(_paymentRef, referencedEscrows[_paymentRef].amount);
    }
    
    // We ignore the due date if the escrow already exists and its amount has not been claimed yet
    function escrowFAUWithReferenceUntilDueDate(bytes memory _paymentRef, uint256 _amount, address _payee, uint256 _dueDate) public {
        // "logicType should be 0 for time based or 1 for MS based"
        // Only FAU for the POC
        IERC20 paymentToken = IERC20(paymentTokenAddress);
        require(paymentToken.transferFrom(msg.sender, address(this), _amount), "Cannot lock tokens as requested, did you approve FAU?");
        if (referencedEscrows[_paymentRef].amount == 0) {
            referencedEscrows[_paymentRef].amount = _amount;
            referencedEscrows[_paymentRef].logicType = 0;
            referencedEscrows[_paymentRef].payer = msg.sender;
            referencedEscrows[_paymentRef].payee = _payee;
            referencedEscrows[_paymentRef].paymentToken = paymentToken;
            referencedEscrows[_paymentRef].dueDate = _dueDate;
        } else {
            require(referencedEscrows[_paymentRef].logicType == 0, "An escrow of another type alread exists for this invoice");
            // HERE we ignore the due date on purpose
            referencedEscrows[_paymentRef].amount = referencedEscrows[_paymentRef].amount + _amount;
        }
        emit EscrowLocked(_paymentRef, _amount, _payee, paymentTokenAddress);
    }
    
    function withdraw(bytes memory _paymentRef, uint256 _amount) public {
        require(referencedEscrows[_paymentRef].amount > 0 && 
            referencedEscrows[_paymentRef].logicType == 0 && 
            referencedEscrows[_paymentRef].amount >= _amount &&
            referencedEscrows[_paymentRef].dueDate <= block.timestamp
            , "Impossible to withdraw, unallowed or the escrow is milestone based.");
            
        IERC20 paymentToken = IERC20(paymentTokenAddress);
        paymentToken.transfer(referencedEscrows[_paymentRef].payee, _amount);
        referencedEscrows[_paymentRef].amount = referencedEscrows[_paymentRef].amount - _amount;
        emit EscrowUnlocked(_paymentRef, _amount, referencedEscrows[_paymentRef].payee, paymentTokenAddress);
    }
    
    function withdrawAll(bytes memory _paymentRef) public {
        withdraw(_paymentRef, referencedEscrows[_paymentRef].amount);
    }
}
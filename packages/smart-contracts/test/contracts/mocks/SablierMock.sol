pragma solidity 0.5.11;

import "github.com/sablierhq/sablier/blob/develop/packages/protocol/contracts/interfaces/IERC1620.sol";

/**
 * @title ERC1620Mock
 * @author Request
 */
contract ERC1620Mock is IERC1620 {
    /*** Storage Properties ***/

    /**
     * @notice Counter for new stream ids.
     */
    uint256 public nextStreamId;


    /*** Events ***/

    /**
     * @notice Emits when a stream is successfully created.
     */
    event CreateStream(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 deposit,
        address tokenAddress,
        uint256 startTime,
        uint256 stopTime
    );

    /*** Modifiers ***/


    /*** Contract Logic Starts Here */

    constructor() public {
        nextStreamId = 1;
    }


    /*** View Functions ***/


    /*** Public Effects & Interactions Functions ***/

    /**
     * @notice Creates a new stream funded by `msg.sender` and paid towards `recipient`.
     * @dev Throws if paused.
     *  Throws if the recipient is the zero address, the contract itself or the caller.
     *  Throws if the deposit is 0.
     *  Throws if the start time is before `block.timestamp`.
     *  Throws if the stop time is before the start time.
     *  Throws if the duration calculation has a math error.
     *  Throws if the deposit is smaller than the duration.
     *  Throws if the deposit is not a multiple of the duration.
     *  Throws if the rate calculation has a math error.
     *  Throws if the next stream id calculation has a math error.
     *  Throws if the contract is not allowed to transfer enough tokens.
     *  Throws if there is a token transfer failure.
     * @param recipient The address towards which the money is streamed.
     * @param deposit The amount of money to be streamed.
     * @param tokenAddress The ERC20 token to use as streaming currency.
     * @param startTime The unix timestamp for when the stream starts.
     * @param stopTime The unix timestamp for when the stream stops.
     * @return The uint256 id of the newly created stream.
     */

    function createStream(address recipient, uint256 deposit, address tokenAddress, uint256 startTime, uint256 stopTime)
        public
        returns (uint256)
    {

        /* Create and store the stream object. */
        uint256 streamId = nextStreamId;
        // streams[streamId] = Types.Stream({
        //     remainingBalance: deposit,
        //     deposit: deposit,
        //     isEntity: true,
        //     ratePerSecond: vars.ratePerSecond,
        //     recipient: recipient,
        //     sender: msg.sender,
        //     startTime: startTime,
        //     stopTime: stopTime,
        //     tokenAddress: tokenAddress
        // });

        /* Increment the next stream id. */
        // TODO: use addUInt instead
        nextStreamId++;

        // require(IERC20(tokenAddress).transferFrom(msg.sender, address(this), deposit), "token transfer failure");
        emit CreateStream(streamId, msg.sender, recipient, deposit, tokenAddress, startTime, stopTime);
        return streamId;
    }
}

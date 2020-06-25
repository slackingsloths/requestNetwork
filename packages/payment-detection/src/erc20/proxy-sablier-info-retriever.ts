import { PaymentTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { ethers } from 'ethers';
const bigNumber: any = require('bn.js');

// The ERC20 proxy smart contract ABI fragment containing TransferWithReference event
const erc1620ProxyContractAbiFragment = [
  'event StreamWithReference(address tokenAddress, address to, uint256 amount, address streamContractAddress, uint256 streamId, bytes indexed paymentReference)',
];

// The ERC1620 proxy smart contract ABI fragment containing TransferWithReference event
const streamContractAbiFragment = [
  'event CreateStream(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 deposit, address tokenAddress, uint256 startTime, uint256 stopTime)',
];

/**
 * Retrieves a list of payment events from a payment reference, a destination address, a token address and a proxy contract
 */
export default class ProxyERC1620InfoRetriever
  implements PaymentTypes.IPaymentNetworkInfoRetriever<PaymentTypes.ERC20PaymentNetworkEvent> {
  public contractProxy: ethers.Contract;
  public provider: ethers.providers.Provider;

  /**
   * @param paymentReference The reference to identify the payment
   * @param proxyContractAddress The address of the proxy contract
   * @param proxyCreationBlockNumber The block that created the proxy contract
   * @param tokenContractAddress The address of the ERC20 contract
   * @param toAddress Address of the balance we want to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The Ethereum network to use
   */
  constructor(
    private paymentReference: string,
    private proxyContractAddress: string,
    private proxyCreationBlockNumber: number,
    private tokenContractAddress: string,
    private toAddress: string,
    private network: string,
  ) {
    // Creates a local or default provider
    this.provider =
      this.network === 'private'
        ? new ethers.providers.JsonRpcProvider()
        : ethers.getDefaultProvider(this.network);

    // Setup the ERC20 proxy contract interface
    this.contractProxy = new ethers.Contract(
      this.proxyContractAddress,
      erc1620ProxyContractAbiFragment,
      this.provider,
    );
  }

  /**
   * Retrieves transfer events for the current contract, address and network.
   */
  public async getTransferEvents(): Promise<PaymentTypes.ERC20PaymentNetworkEvent[]> {
    // Create a filter to find all the Transfer logs for the toAddress
    const filter = this.contractProxy.filters.StreamWithReference(
      null,
      null,
      null,
      null,
      null,
      '0x' + this.paymentReference,
    ) as ethers.providers.Filter;
    filter.fromBlock = this.proxyCreationBlockNumber;
    filter.toBlock = 'latest';

    // Get the event logs
    const logs = await this.provider.getLogs(filter);

    let paymentStreamInitEvents: Promise<PaymentTypes.IERC20PaymentEventParameters[]> = [];

    // Parses, filters and creates the events from the logs of the proxy contract
    const eventPromises = logs
      // Parses the logs
      .map(log => {
        const parsedLog = this.contractProxy.interface.parseLog(log);
        return { parsedLog, log };
      })
      // Keeps only the log with the right token and the right destination address
      .filter(
        log =>
          log.parsedLog.values.tokenAddress.toLowerCase() ===
            this.tokenContractAddress.toLowerCase() &&
          log.parsedLog.values.to.toLowerCase() === this.toAddress.toLowerCase(),
      )
      // Fetches the stream
      .map(async log => {
        const streamContract = new ethers.Contract(
          log.parsedLog.values.streamContractAddress,
          streamContractAbiFragment,
          this.provider,
        );
        // TODO fetch stream interrups and other relevant events if needed
        const streamFilter = streamContract.filters.CreateStream(
          log.parsedLog.values.streamId
        ) as ethers.providers.Filter;
        // TODO improve fromBlock fetching
        filter.fromBlock = this.proxyCreationBlockNumber;
        filter.toBlock = 'latest';
    
        // Get the event logs
        const streamLogs = await this.provider.getLogs(streamFilter);
        if(streamLogs.length !== 1) {
          throw Error(`Expected to find exactly 1 CreateStream event for the streamID: ${log.parsedLog.values.streamId} and found: ${streamLogs.length} instead.`);
        }

        // Parse them
        const parsedStreamLog = streamContract.interface.parseLog(streamLogs[0]);   

        const now = Utils.getCurrentTimestampInSecond();
        const totalDuration = parsedStreamLog.values.stopTime - parsedStreamLog.values.startTime;
        const paymentDuration = Math.max(Math.min(now - parsedStreamLog.values.startTime, totalDuration), 0);
        
        // TODO check how numbers are truncated or rounded
        const amount = bigNumber.new(parsedStreamLog.values.deposit)
          .mul(paymentDuration)
          .div(totalDuration);
        
        if(parsedStreamLog.values.startTime < now) {
          return [{
            amount,
            name: PaymentTypes.EVENTS_NAMES.PAYMENT,
            parameters: {
              // TODO
            },
            timestamp: Math.min(parsedStreamLog.values.stopTime, now),
          }, {
            amount: parsedStreamLog.values.deposit,
            name: PaymentTypes.EVENTS_NAMES.PAYMENT_STREAM_INIT,
            parameters: {
              block: streamLogs[0].blockNumber,
              to: this.toAddress,
              txHash: streamLogs[0].transactionHash,
            },
            timestamp: (await this.provider.getBlock(streamLogs[0].blockNumber || 0)).timestamp,
          }
        }]

      });

    return Promise.all(Utils.flatten2DimensionsArray(eventPromises));
  }
}
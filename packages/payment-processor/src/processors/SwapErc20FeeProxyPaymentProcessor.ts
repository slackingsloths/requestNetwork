import { erc20SwapToPayArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes } from '@requestnetwork/types';
import { BigNumberish, ethers, providers, Signer } from 'ethers';
import { ERC20SwapToPay__factory } from 'smart-contracts/types';
import { FeePaymentProcessorBaseOptions, FeePaymentProcessorBase } from './PaymentProcessorBase';

type SwapErc20FeeProxyOptions = FeePaymentProcessorBaseOptions & {
  deadline: number;
  maxInputAmount: BigNumberish;
  path: string[];
};

export class SwapErc20FeeProxyPaymentProcessor extends FeePaymentProcessorBase<SwapErc20FeeProxyOptions> {
  constructor(
    request: ClientTypes.IRequestData,
    options: SwapErc20FeeProxyOptions,
    signerOrProvider?: providers.Web3Provider | Signer,
  ) {
    super(request, options, signerOrProvider);
    if (!options.deadline) {
      throw new Error('options.deadline is required');
    }
    if (!options.maxInputAmount) {
      throw new Error('options.maxInputAmount is required');
    }
    if (!options.path) {
      throw new Error('options.path is required');
    }
  }

  get data(): string {
    if (!this.options) {
      throw new Error('options not set');
    }
    const { paymentAddress, paymentReference, feeAddress } = this.paymentValues;
    const { path, maxInputAmount, deadline } = this.options;
    const tokenAddress = this.request.currencyInfo.value;

    if (path[path.length - 1].toLowerCase() !== tokenAddress.toLowerCase()) {
      throw new Error('Last item of the path should be the request currency');
    }

    if (Date.now() > deadline * 1000) {
      throw new Error('A swap with a past deadline will fail, the transaction will not be pushed');
    }

    const swapToPayContract = ERC20SwapToPay__factory.connect(this.to, this.signer);
    return swapToPayContract.interface.encodeFunctionData('swapTransferWithReference', [
      paymentAddress,
      this.amountToPay,
      maxInputAmount,
      path,
      `0x${paymentReference}`,
      this.feeToPay,
      feeAddress || ethers.constants.AddressZero,
      Math.round(deadline / 1000),
    ]);
  }

  get to(): string {
    return erc20SwapToPayArtifact.getAddress(this.request.currencyInfo.network || 'mainnet');
  }
}

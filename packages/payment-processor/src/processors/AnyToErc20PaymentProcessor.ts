import { getConversionPath, getDecimalsForCurrency } from '@requestnetwork/currency';
import { erc20ConversionProxy, erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { Erc20ConversionProxy__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, RequestLogicTypes } from '@requestnetwork/types';
import { BigNumberish, ethers, providers, Signer } from 'ethers';
import { FeePaymentProcessorBase, FeePaymentProcessorBaseOptions } from './PaymentProcessorBase';

export type AnyToErc20Options = FeePaymentProcessorBaseOptions & {
  currency: RequestLogicTypes.ICurrency;
  maxToSpend: BigNumberish;
};

export class AnyToErc20PaymentProcessor extends FeePaymentProcessorBase<AnyToErc20Options> {
  private path: string[];
  constructor(
    request: ClientTypes.IRequestData,
    options: AnyToErc20Options,
    signerOrProvider?: providers.Web3Provider | Signer,
  ) {
    super(request, options, signerOrProvider);
    if (!options.currency.network) {
      throw new Error('Cannot pay with a currency missing a network');
    }
    // Compute the path automatically
    const path = getConversionPath(
      this.request.currencyInfo,
      options.currency,
      options.currency.network,
    );
    if (!path) {
      throw new Error(
        `Impossible to find a conversion path between from ${request.currencyInfo.value} to ${this.options.currency.value}`,
      );
    }

    this.path = path;
  }

  get data(): string {
    // Check request TODO
    // validateConversionFeeProxyRequest(request, path, amount, feeAmountOverride);

    const { paymentReference, paymentAddress, feeAddress, maxRateTimespan } = this.paymentValues;

    const chainlinkDecimal = 8;
    const decimalPadding = Math.max(
      chainlinkDecimal - getDecimalsForCurrency(this.request.currencyInfo),
      0,
    );

    // eslint-disable-next-line no-magic-numbers
    const amountToPay = this.amountToPay.mul(10 ** decimalPadding);
    const feeToPay = this.feeToPay.mul(10 ** decimalPadding);
    const proxyAddress = erc20ConversionProxy.getAddress(
      this.options.currency.network || 'mainnet',
    );
    const proxyContract = Erc20ConversionProxy__factory.connect(proxyAddress, this.signer);

    return proxyContract.interface.encodeFunctionData('transferFromWithReferenceAndFee', [
      paymentAddress,
      amountToPay,
      this.path,
      `0x${paymentReference}`,
      feeToPay,
      feeAddress || ethers.constants.AddressZero,
      this.options.maxToSpend,
      maxRateTimespan || 0,
    ]);
  }

  get to(): string {
    return erc20ProxyArtifact.getAddress(this.request.currencyInfo.network || 'mainnet');
  }
}

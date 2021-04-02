import { ClientTypes } from '@requestnetwork/types';
import { BigNumber, providers, Signer } from 'ethers';
import { BasePaymentOptions, PaymentProcessorBase } from './PaymentProcessorBase';

export class EthInputDataPaymentProcessor extends PaymentProcessorBase {
  constructor(
    request: ClientTypes.IRequestData,
    options: BasePaymentOptions,
    signerOrProvider?: providers.Web3Provider | Signer,
  ) {
    super(request, options, signerOrProvider);
  }

  get value(): BigNumber {
    return this.amountToPay;
  }

  get data(): string {
    return `0x${this.paymentValues.paymentReference}`;
  }

  get to(): string {
    return this.paymentValues.paymentAddress;
  }
}

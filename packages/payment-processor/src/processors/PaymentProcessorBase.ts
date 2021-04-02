import { ClientTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';
import { BigNumber, BigNumberish, providers, Signer } from 'ethers';
import {
  getAmountToPay,
  getPaymentNetwork,
  getRequestPaymentValues,
  getSigner,
  IPaymentValues,
  validateRequest,
} from '../utils';

export type BasePaymentOptions = {
  amount?: BigNumberish;
};

export abstract class PaymentProcessorBase<
  TOptions extends BasePaymentOptions = BasePaymentOptions
> {
  public readonly signer: Signer;

  constructor(
    protected request: ClientTypes.IRequestData,
    protected options: TOptions,
    signerOrProvider?: providers.Web3Provider | Signer,
  ) {
    this.signer = getSigner(signerOrProvider);
    validateRequest(this.request, this.paymentNetwork);
  }

  abstract get data(): string;
  abstract get to(): string;

  get paymentNetwork(): PaymentTypes.PAYMENT_NETWORK_ID {
    const pn = getPaymentNetwork(this.request);
    if (!pn) {
      throw new Error('cannot find payment network');
    }
    if (pn === ExtensionTypes.ID.CONTENT_DATA) {
      throw new Error('invalid payment networl');
    }
    return (pn as unknown) as PaymentTypes.PAYMENT_NETWORK_ID;
  }

  get supportsApproval(): boolean {
    return false;
  }

  get requiresApproval(): Promise<boolean> {
    throw new Error('Not implemented');
  }

  get value(): BigNumberish {
    return BigNumber.from(0);
  }

  get amountToPay(): BigNumber {
    return getAmountToPay(this.request, this.options?.amount);
  }

  get paymentValues(): IPaymentValues {
    return getRequestPaymentValues(this.request);
  }

  get transactionParameters(): Pick<providers.TransactionRequest, 'data' | 'to' | 'value'> {
    return {
      to: this.to,
      data: this.data,
      value: this.value,
    };
  }
}

export type FeePaymentProcessorBaseOptions = BasePaymentOptions & {
  feeAmount?: BigNumberish;
};

export abstract class FeePaymentProcessorBase<
  TOptions extends FeePaymentProcessorBaseOptions = FeePaymentProcessorBaseOptions
> extends PaymentProcessorBase<TOptions> {
  constructor(
    request: ClientTypes.IRequestData,
    options: TOptions,
    signerOrProvider?: providers.Web3Provider | Signer,
  ) {
    super(request, options, signerOrProvider);
  }

  get feeToPay(): BigNumber {
    return BigNumber.from(this.options?.feeAmount || this.paymentValues.feeAmount || 0);
  }
}

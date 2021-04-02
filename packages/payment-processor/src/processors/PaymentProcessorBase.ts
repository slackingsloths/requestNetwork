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

  /**
   * Transaction Data
   */
  abstract get data(): string;

  /**
   * Transaction To
   */
  abstract get to(): string;

  /**
   * Transaction Value
   */
  get value(): BigNumberish {
    return BigNumber.from(0);
  }

  /**
   * Transaction parameters to pass to the web3 provider
   */
  get transactionParameters(): Pick<providers.TransactionRequest, 'data' | 'to' | 'value'> {
    return {
      to: this.to,
      data: this.data,
      value: this.value,
    };
  }

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

  /**
   * The amount to pay, based on the options and the request amount
   */
  get amountToPay(): BigNumber {
    return getAmountToPay(this.request, this.options?.amount);
  }

  get paymentValues(): IPaymentValues {
    return getRequestPaymentValues(this.request);
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

  /**
   * The fees to pay, based on the options and the request fee amount
   */
  get feeToPay(): BigNumber {
    return BigNumber.from(this.options?.feeAmount || this.paymentValues.feeAmount || 0);
  }
}

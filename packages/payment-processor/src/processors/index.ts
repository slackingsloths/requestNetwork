import { BigNumberish, providers, Signer } from 'ethers';

import { ClientTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import { canSwapToPay } from '../swap';
import { getPaymentNetwork } from '../utils';
import { UnsupportedNetworkError } from '../errors';

import { PaymentProcessorBase } from './PaymentProcessorBase';
import { ISwapSettings } from '../payment/swap-erc20-fee-proxy';
import { EthProxyPaymentProcessor } from './EthProxyPaymentProcessor';
import { AnyToErc20PaymentProcessor } from './AnyToErc20PaymentProcessor';
import { EthInputDataPaymentProcessor } from './EthInputDataPaymentProcessor';
import { SwapErc20FeeProxyPaymentProcessor } from './SwapErc20FeeProxyPaymentProcessor';
import { Erc20ProxyContractPaymentProcessor } from './Erc20ProxyContractPaymentProcessor';
import { Erc20FeeProxyContractPaymentProcessor } from './Erc20FeeProxyContractPaymentProcessor';

export type PaymentSettings = {
  amount?: BigNumberish;
  feeAmount?: BigNumberish;

  /**
   * Specifies whether or not the connected wallet is a multisig
   *
   * Can be initialized with utils.isMultisig
   */
  multisig?: boolean;

  /**
   * Settings for performing a swap & pay.
   *
   * The presence of this setting will enforce a swap payment. If Swap is not supported, an error will occur
   */
  swapSettings?: ISwapSettings;

  /**
   * The currency used for payment.
   *
   * Required for on chain conversion (ANY_TO_ERC20_PROXY).
   * Not available for other payment networks
   */
  currency?: RequestLogicTypes.ICurrency;

  /**
   * maximum amount of token the user is willing to spend
   *
   * Required for on chain conversion (ANY_TO_ERC20_PROXY).
   * Not available for other payment networks
   */
  maxToSpend?: BigNumberish;
};

export const processorFactory = (
  request: ClientTypes.IRequestData,
  paymentSettings?: PaymentSettings,
  signerOrProvider?: providers.Web3Provider | Signer,
): PaymentProcessorBase => {
  const pn = getPaymentNetwork(request);
  if (!pn) {
    throw new Error(`Could not find payment processor for request ${request.requestId}`);
  }

  if (paymentSettings?.swapSettings) {
    if (!canSwapToPay(request)) {
      throw new Error(`Swap not supported for ${pn}`);
    }
    return new SwapErc20FeeProxyPaymentProcessor(request, {
      amount: paymentSettings.amount,
      feeAmount: paymentSettings.feeAmount,
      ...paymentSettings.swapSettings,
    });
  }

  switch (pn) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
      return new Erc20ProxyContractPaymentProcessor(
        request,
        { amount: paymentSettings?.amount },
        signerOrProvider,
      );
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      return new Erc20FeeProxyContractPaymentProcessor(
        request,
        {
          amount: paymentSettings?.amount,
          feeAmount: paymentSettings?.feeAmount,
        },
        signerOrProvider,
      );
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      if (paymentSettings?.multisig) {
        return new EthProxyPaymentProcessor(
          request,
          { amount: paymentSettings?.amount },
          signerOrProvider,
        );
      }
      return new EthInputDataPaymentProcessor(
        request,
        { amount: paymentSettings?.amount },
        signerOrProvider,
      );
    case ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY:
      if (!paymentSettings) {
        throw new Error(`paymentSettings is required for ${pn}`);
      }
      if (!paymentSettings.currency) {
        throw new Error(`paymentSettings.currency is required for ${pn}`);
      }
      if (!paymentSettings.maxToSpend) {
        throw new Error(`paymentSettings.maxToSpend is required for ${pn}`);
      }
      return new AnyToErc20PaymentProcessor(
        request,
        {
          amount: paymentSettings.amount,
          feeAmount: paymentSettings.feeAmount,
          currency: paymentSettings.currency,
          maxToSpend: paymentSettings.maxToSpend,
        },
        signerOrProvider,
      );
    default:
      throw new UnsupportedNetworkError(pn);
  }
};

export { Erc20ProxyContractPaymentProcessor, Erc20FeeProxyContractPaymentProcessor };

import { ContractTransaction, Signer, BigNumber, BigNumberish, providers } from 'ethers';

import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';

import { getBtcPaymentUrl } from './btc-address-based';
import { _getErc20PaymentUrl, getAnyErc20Balance } from './erc20';
import { payErc20Request } from './erc20';
import { _getEthPaymentUrl, payEthInputDataRequest } from './eth-input-data';
import { ITransactionOverrides } from './transaction-overrides';
import {
  getNetworkProvider,
  getPaymentNetwork,
  getProvider,
  getRequestPaymentValues,
  getSigner,
} from '../utils';
import { ISwapSettings } from './swap-erc20-fee-proxy';
import { RequestLogicTypes } from '@requestnetwork/types';
import {
  encodePayAnyToErc20ProxyRequest,
  IPaymentSettings,
  payAnyToErc20ProxyRequest,
} from './any-to-erc20-proxy';
import { encodePayEthProxyRequest } from './eth-proxy';
import {
  erc20ConversionProxy,
  erc20FeeProxyArtifact,
  erc20ProxyArtifact,
} from '@requestnetwork/smart-contracts';
import { canSwapToPay } from '../swap';

export const supportedNetworks = [
  ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
  ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
  ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
];

/**
 * Error thrown when the network is not supported.
 */
export class UnsupportedNetworkError extends Error {
  constructor(public networkName?: string) {
    super(`Payment network ${networkName} is not supported`);
  }
}

/**
 * Processes a transaction to pay a Request.
 * Supported networks: ERC20_PROXY_CONTRACT, ETH_INPUT_DATA, ERC20_FEE_PROXY_CONTRACT
 *
 * @throws UnsupportedNetworkError if network isn't supported for swap or payment.
 * @param request the request to pay.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function payRequest(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
  paymentSettings?: IPaymentSettings,
): Promise<ContractTransaction> {
  const signer = getSigner(signerOrProvider);
  const paymentNetwork = getPaymentNetwork(request);
  switch (paymentNetwork) {
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT:
    case ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT:
      return payErc20Request(request, signer, amount, undefined, overrides);
    case ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_ERC20_PROXY: {
      if (!paymentSettings) {
        throw new Error('Missing payment settings for a payment with conversion');
      }
      return payAnyToErc20ProxyRequest(
        request,
        signer,
        paymentSettings,
        amount,
        undefined,
        overrides,
      );
    }
    case ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA:
      return payEthInputDataRequest(request, signer, amount, overrides);
    default:
      throw new UnsupportedNetworkError(paymentNetwork);
  }
}

/**
 * Processes a transaction to pay a Request with a swap
 * Supported payment networks: ERC20_PROXY_CONTRACT, ETH_INPUT_DATA, ERC20_FEE_PROXY_CONTRACT
 *
 * @throws UnsupportedNetworkError if network isn't supported for swap or payment.
 * @param request the request to pay.
 * @param swapSettings the information of how to swap from another payment token.
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 * @param amount optionally, the amount to pay in request currency. Defaults to remaining amount of the request.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function swapToPayRequest(
  request: ClientTypes.IRequestData,
  swapSettings: ISwapSettings,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  amount?: BigNumberish,
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const signer = getSigner(signerOrProvider);
  const paymentNetwork = getPaymentNetwork(request);
  if (!canSwapToPay(request)) {
    throw new UnsupportedNetworkError(paymentNetwork);
  }
  return payErc20Request(request, signer, amount, undefined, overrides, swapSettings);
}

/**
 * Verifies the address has enough funds to pay the request in its currency.
 * Supported networks: ERC20_PROXY_CONTRACT, ETH_INPUT_DATA
 *
 * @throws UnsupportedNetworkError if network isn't supported
 * @param request the request to verify.
 * @param address the address holding the funds
 * @param provider the Web3 provider. Defaults to Etherscan.
 */
export async function hasSufficientFunds(
  request: ClientTypes.IRequestData,
  address: string,
  provider?: providers.Provider,
): Promise<boolean> {
  const paymentNetwork = getPaymentNetwork(request);
  if (!paymentNetwork || !supportedNetworks.includes(paymentNetwork)) {
    throw new UnsupportedNetworkError(paymentNetwork);
  }

  if (!provider) {
    provider = getNetworkProvider(request);
  }

  let feeAmount = 0;
  if (paymentNetwork === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT) {
    feeAmount = request.extensions[paymentNetwork].values.feeAmount || 0;
  }
  return isSolvent(
    address,
    request.currencyInfo,
    BigNumber.from(request.expectedAmount).add(feeAmount),
    provider,
  );
}

/**
 * Verifies the address has enough funds to pay an amount in a given currency.
 *
 * @param fromAddress the address willing to pay
 * @param amount
 * @param currency
 * @param provider the Web3 provider. Defaults to Etherscan.
 * @throws UnsupportedNetworkError if network isn't supported
 */
export async function isSolvent(
  fromAddress: string,
  currency: RequestLogicTypes.ICurrency,
  amount: BigNumberish,
  provider: providers.Provider,
): Promise<boolean> {
  const ethBalance = await provider.getBalance(fromAddress);
  const needsGas = !['Safe Multisig WalletConnect', 'Gnosis Safe Multisig'].includes(
    (provider as any)?.provider?.wc?._peerMeta?.name,
  );

  if (currency.type === 'ETH') {
    return ethBalance.gt(amount);
  } else {
    const balance = await getCurrencyBalance(fromAddress, currency, provider);
    return (ethBalance.gt(0) || !needsGas) && BigNumber.from(balance).gte(amount);
  }
}

/**
 * Returns the balance of a given address in a given currency.
 * @param address the address holding the funds
 * @param paymentCurrency if different from the requested currency
 * @param provider the Web3 provider. Defaults to Etherscan.
 * @throws UnsupportedNetworkError if the currency is not implemented.
 */
async function getCurrencyBalance(
  address: string,
  paymentCurrency: RequestLogicTypes.ICurrency,
  provider: providers.Provider,
): Promise<BigNumberish> {
  switch (paymentCurrency.type) {
    case 'ETH': {
      return provider.getBalance(address);
    }
    case 'ERC20': {
      return getAnyErc20Balance(paymentCurrency.value, address, provider);
    }
    default:
      throw new UnsupportedNetworkError(paymentCurrency.network);
  }
}

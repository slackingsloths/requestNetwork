import { ClientTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { BigNumber, BigNumberish, ethers, providers, Signer } from 'ethers';
import { UnsupportedNetworkError, verifySupportedNetwork } from './errors';
import { getAnyErc20Balance } from './payment/erc20';
import { ITransactionOverrides } from './payment/transaction-overrides';
import { processorFactory, PaymentSettings } from './processors';
import { getNetworkProvider, isMultisig } from './utils';

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
export const payRequest = (
  request: ClientTypes.IRequestData,
  paymentSettings?: PaymentSettings,
  signerOrProvider?: providers.Web3Provider | Signer,
  overrides?: ITransactionOverrides,
): Promise<ethers.providers.TransactionResponse> => {
  const processor = processorFactory(request, paymentSettings, signerOrProvider);
  return processor.signer.sendTransaction({
    ...processor.transactionParameters,
    ...overrides,
  });
};

export const prepareRequestPayment = (
  request: ClientTypes.IRequestData,
  paymentSettings?: PaymentSettings,
): Pick<providers.TransactionRequest, 'data' | 'to' | 'value'> => {
  const processor = processorFactory(request, paymentSettings);
  return processor.transactionParameters;
};

export const encodeRequestPayment = (
  request: ClientTypes.IRequestData,
  paymentSettings?: PaymentSettings,
): string => {
  const processor = processorFactory(request, paymentSettings);
  return processor.data;
};

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
  const paymentNetwork = verifySupportedNetwork(request);

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
  const mulitsig = await isMultisig(provider, fromAddress);

  if (currency.type === 'ETH') {
    return ethBalance.gt(amount);
  } else {
    const balance = await getCurrencyBalance(fromAddress, currency, provider);
    return (ethBalance.gt(0) || mulitsig) && BigNumber.from(balance).gte(amount);
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

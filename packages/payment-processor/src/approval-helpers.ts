import { erc20SwapToPayArtifact } from '@requestnetwork/smart-contracts';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import { BigNumberish, providers, Signer } from 'ethers';
import { artifacts } from './artifacts';
import { verifySupportedNetwork } from './errors';
import { PaymentSettings, processorFactory } from './processors';
import { getConnectedAddress, getNetworkProvider, getPaymentNetwork } from './utils';

/**
 * Checks if the request is of a payment network that requires approval.
 * @remark to check if the allowance is sufficient for the given request, use `hasErc20Approval`
 * @param request request to pay
 */
export function requiresApproval(request: ClientTypes.IRequestData): boolean {
  const pn = getPaymentNetwork(request);
  const type = request.currencyInfo.type;
  return (
    type === RequestLogicTypes.CURRENCY.ERC20 &&
    pn !== ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_ADDRESS_BASED
  );
}

/**
 * Checks if the proxy has the necessary allowance from a given account to pay a given request with ERC20
 * @param request request to pay
 * @param account account that will be used to pay the request
 * @param provider the web3 provider. Defaults to Etherscan.
 */
export async function hasErc20Approval(
  request: ClientTypes.IRequestData,
  paymentSettings: PaymentSettings,
  account?: string,
  provider: providers.Provider = getNetworkProvider(request),
): Promise<boolean> {
  if (!requiresApproval(request)) {
    return true;
  }

  const processor = processorFactory(request, paymentSettings);
  if (!account) {
    account = await getConnectedAddress(provider);
  }

  return checkErc20Allowance(
    account,
    getProxyAddress(request, paymentSettings),
    provider,
    request.currencyInfo.value,
    processor.amountToPay,
  );
}

/**
 * Checks if a spender has enough allowance from an ERC20 token owner to pay an amount.
 * @param ownerAddress address of the owner
 * @param spenderAddress address of the spender
 * @param provider the web3 provider. Defaults to Etherscan.
 * @param paymentCurrency ERC20 currency
 * @param amount
 */
export async function checkErc20Allowance(
  ownerAddress: string,
  spenderAddress: string,
  signerOrProvider: providers.Provider | Signer,
  tokenAddress: string,
  amount: BigNumberish,
): Promise<boolean> {
  const erc20Contract = ERC20__factory.connect(tokenAddress, signerOrProvider);
  const allowance = await erc20Contract.allowance(ownerAddress, spenderAddress);
  return allowance.gte(amount);
}

/**
 * Get the request payment network proxy address
 * @param request
 * @returns the payment network proxy address
 */
export function getProxyAddress(
  request: ClientTypes.IRequestData,
  paymentSettings: PaymentSettings,
): string {
  const id = verifySupportedNetwork(request);
  const artifact = paymentSettings?.swapSettings ? erc20SwapToPayArtifact : artifacts[id];
  if (artifact) {
    return artifact.getAddress(request.currencyInfo.network || 'mainnet');
  }

  throw new Error(`Unsupported payment network: ${id}`);
}

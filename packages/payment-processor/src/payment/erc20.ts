import { ContractTransaction, Signer, BigNumber, BigNumberish, providers } from 'ethers';

import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import { ERC20__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';
import {
  getNetworkProvider,
  getPaymentNetworkExtension,
  getProvider,
  getSigner,
  validateRequest,
} from '../utils';
import { ITransactionOverrides } from './transaction-overrides';

/**
 * Processes the approval transaction of the targeted ERC20.
 * @param request request to pay
 * @param provider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20IfNeeded(
  request: ClientTypes.IRequestData,
  account: string,
  signerOrProvider: providers.Provider | Signer = getNetworkProvider(request),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction | void> {
  if (!(await hasErc20Approval(request, account, signerOrProvider))) {
    return approveErc20(request, getSigner(signerOrProvider), overrides);
  }
}

/**
 * Processes the transaction to approve the proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request request to pay
 * @param provider the web3 provider. Defaults to Etherscan.
 * @param overrides optionally, override default transaction values, like gas.
 */
export async function approveErc20(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
  overrides?: ITransactionOverrides,
): Promise<ContractTransaction> {
  const encodedTx = encodeApproveErc20(request, signerOrProvider);
  const signer = getSigner(signerOrProvider);
  const tokenAddress = request.currencyInfo.value;
  const tx = await signer.sendTransaction({
    data: encodedTx,
    to: tokenAddress,
    value: 0,
    ...overrides,
  });
  return tx;
}

/**
 * Encodes the transaction to approve the proxy to spend signer's tokens to pay
 * the request in its payment currency. Can be used with a Multisig contract.
 * @param request the request to pay
 * @param signerOrProvider the Web3 provider, or signer. Defaults to window.ethereum.
 */
export function encodeApproveErc20(
  request: ClientTypes.IRequestData,
  signerOrProvider: providers.Web3Provider | Signer = getProvider(),
): string {
  const paymentNetworkId = (getPaymentNetworkExtension(request)
    ?.id as unknown) as PaymentTypes.PAYMENT_NETWORK_ID;
  if (!paymentNetworkId) {
    throw new Error('No payment network Id');
  }
  validateRequest(request, paymentNetworkId);
  return encodeApproveAnyErc20(
    request.currencyInfo.value,
    getProxyAddress(request),
    getSigner(signerOrProvider),
  );
}

/**
 * Encodes the approval call to approve any erc20 token to be spent, with no limit.
 * @param tokenAddress the ERC20 token address to approve
 * @param spenderAddress the address granted the approval
 * @param signerOrProvider the signer who owns ERC20 tokens
 */
export function encodeApproveAnyErc20(
  tokenAddress: string,
  spenderAddress: string,
  signerOrProvider: providers.Provider | Signer = getProvider(),
): string {
  const erc20interface = ERC20__factory.connect(tokenAddress, signerOrProvider).interface;
  return erc20interface.encodeFunctionData('approve', [
    spenderAddress,
    BigNumber.from(2)
      // eslint-disable-next-line no-magic-numbers
      .pow(256)
      .sub(1),
  ]);
}

/**
 * Gets ERC20 balance of an address, based on the request currency information
 * @param request the request that contains currency information
 * @param address the address to check
 * @param provider the web3 provider. Defaults to Etherscan
 */
export async function getErc20Balance(
  request: ClientTypes.IRequestData,
  address: string,
  provider: providers.Provider = getNetworkProvider(request),
): Promise<BigNumberish> {
  return getAnyErc20Balance(request.currencyInfo.value, address, provider);
}

/**
 * Gets any ERC20 balance of an address
 * @param anyErc20Address the currency address
 * @param address the address to check
 * @param provider the web3 provider. Defaults to Etherscan
 */
export async function getAnyErc20Balance(
  anyErc20Address: string,
  address: string,
  provider: providers.Provider,
): Promise<BigNumberish> {
  const erc20Contract = ERC20__factory.connect(anyErc20Address, provider);
  return erc20Contract.balanceOf(address);
}

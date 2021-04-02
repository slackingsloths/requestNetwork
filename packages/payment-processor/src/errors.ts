import { ClientTypes, ExtensionTypes } from '@requestnetwork/types';
import { getPaymentNetwork } from './utils';

/**
 * Error thrown when the network is not supported.
 */
export class UnsupportedNetworkError extends Error {
  constructor(public networkName?: string) {
    super(`Payment network ${networkName} is not supported`);
  }
}

export class NoPaymentNetworkError extends Error {
  constructor(public requestId: string) {
    super(`Payment network not found for request ${requestId}`);
  }
}

export const supportedNetworks = [
  ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
  ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT,
  ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
  ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
];

export function verifySupportedNetwork(request: ClientTypes.IRequestData): ExtensionTypes.ID {
  const pn = getPaymentNetwork(request);
  if (!pn) {
    throw new NoPaymentNetworkError(request.requestId);
  }
  if (!supportedNetworks.includes(pn)) {
    throw new UnsupportedNetworkError(pn);
  }
  return pn;
}

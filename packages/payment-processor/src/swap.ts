import { ExtensionTypes, ClientTypes } from '@requestnetwork/types';
import { getPaymentNetwork } from './utils';

/**
 * Given a request, the function gives whether swap is supported for its payment network.
 * @param request the request that accepts or not swap to payment
 */
export function canSwapToPay(request: ClientTypes.IRequestData): boolean {
  const paymentNetwork = getPaymentNetwork(request);
  return (
    paymentNetwork !== undefined &&
    paymentNetwork === ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT
  );
}

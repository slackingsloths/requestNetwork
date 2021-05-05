import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import * as walletAddressValidator from 'wallet-address-validator';
import AddressBasedPaymentNetwork from '../address-based';

const CURRENT_VERSION = '0.1.0';
const BITCOIN_NETWORK = 'prod';

/**
 * Implementation of the payment network to pay in BTC based on the addresses
 * With this extension one request can have two dedicated bitcoin addresses (one for payment and one for refund)
 * Every bitcoin transaction that reaches these addresses will be interpreted as payment or refund.
 * Important: the addresses must be exclusive to the request
 */
export default class BitcoinTestnetAddressBasedPaymentNetwork extends AddressBasedPaymentNetwork {
  public constructor() {
    super(ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED, CURRENT_VERSION);
  }

  /**
   * Check if a bitcoin address is valid
   *
   * @param address address to check
   * @returns true if address is valid
   */
  protected isValidAddress(address: string): boolean {
    return walletAddressValidator.validate(address, 'bitcoin', BITCOIN_NETWORK);
  }

  protected validate(
    request: RequestLogicTypes.IRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _extensionAction: ExtensionTypes.IAction,
  ): void {
    if (request.currency.type !== RequestLogicTypes.CURRENCY.BTC) {
      throw Error(`This extension can be used only on BTC request`);
    }
  }
}

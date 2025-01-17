import PaymentNetworkFactory from './payment-network-factory';
import PaymentReferenceCalculator from './payment-reference-calculator';

import * as BtcPaymentNetwork from './btc';
import DeclarativePaymentNetwork from './declarative';
import * as Erc20PaymentNetwork from './erc20';
import * as EthPaymentNetwork from './eth';
import { initPaymentDetectionApiKeys, setProviderFactory, getDefaultProvider } from './provider';

export {
  PaymentNetworkFactory,
  PaymentReferenceCalculator,
  BtcPaymentNetwork,
  DeclarativePaymentNetwork,
  Erc20PaymentNetwork,
  EthPaymentNetwork,
  setProviderFactory,
  initPaymentDetectionApiKeys,
  getDefaultProvider,
};

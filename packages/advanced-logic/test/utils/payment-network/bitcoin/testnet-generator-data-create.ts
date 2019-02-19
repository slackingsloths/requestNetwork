import * as TestData from '../../test-data-generator';

import {
  Extension as ExtensionTypes,
  Identity as IdentityTypes,
  RequestLogic as Types,
} from '@requestnetwork/types';

// ---------------------------------------------------------------------
// BTC address
export const paymentBTCAddress = '16uyvigo8mMAfE3Ctr5Rwgab1aWNDPDMZD';
export const refundBTCAddress = '13etbjB89ZDMfmcctwT5qwMtrJdmWPBN8W';
export const paymentTestnetBTCAddress = 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v';
export const refundTestnetBTCAddress = 'mfsSPZdcdXwSMVkPwCsiW39P5y6eYE1bDM';

// ---------------------------------------------------------------------
// actions
export const actionCreationWithPaymentAndRefund = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
  parameters: {
    paymentAddress: paymentTestnetBTCAddress,
    refundAddress: refundTestnetBTCAddress,
  },
  version: '0.1.0',
};
export const actionCreationOnlyPayment = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
  parameters: {
    paymentAddress: paymentTestnetBTCAddress,
  },
  version: '0.1.0',
};
export const actionCreationOnlyRefund = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
  parameters: {
    refundAddress: refundTestnetBTCAddress,
  },
  version: '0.1.0',
};
export const actionCreationEmpty = {
  action: 'create',
  id: ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
  parameters: {},
  version: '0.1.0',
};

// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAndRefund = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED as string]: {
    events: [
      {
        name: 'create',
        parameters: {
          paymentAddress: paymentTestnetBTCAddress,
          refundAddress: refundTestnetBTCAddress,
        },
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress: paymentTestnetBTCAddress,
      refundAddress: refundTestnetBTCAddress,
    },
    version: '0.1.0',
  },
};
export const extensionStateCreatedEmpty = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED as string]: {
    events: [
      {
        name: 'create',
        parameters: {},
      },
    ],
    id: ExtensionTypes.ID.PAYMENT_NETWORK_TESTNET_BITCOIN_ADDRESS_BASED,
    type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
    values: {},
    version: '0.1.0',
  },
};

// ---------------------------------------------------------------------
// request states
export const requestStateNoExtensions: Types.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: Types.CURRENCY.BTC,
  events: [
    {
      actionSigner: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: TestData.payeeRaw.address,
      },
      name: Types.ACTION_NAME.CREATE,
      parameters: {
        expectedAmount: '123400000000000000',
        extensionsDataLength: 0,
        isSignedRequest: false,
      },
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
  extensions: {},
  extensionsData: [],
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payerRaw.address,
  },
  requestId: TestData.requestIdMock,
  state: Types.STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version: '0.1.0',
};

export const requestStateCreatedWithPaymentAndRefund: Types.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: Types.CURRENCY.BTC,
  events: [
    {
      actionSigner: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: TestData.payeeRaw.address,
      },
      name: Types.ACTION_NAME.CREATE,
      parameters: {
        expectedAmount: '123400000000000000',
        extensionsDataLength: 1,
        isSignedRequest: false,
      },
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
  extensions: extensionStateWithPaymentAndRefund,
  extensionsData: [actionCreationWithPaymentAndRefund],
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payerRaw.address,
  },
  requestId: TestData.requestIdMock,
  state: Types.STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version: '0.1.0',
};

export const requestStateCreatedEmpty: Types.IRequest = {
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: Types.CURRENCY.BTC,
  events: [
    {
      actionSigner: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: TestData.payeeRaw.address,
      },
      name: Types.ACTION_NAME.CREATE,
      parameters: {
        expectedAmount: '123400000000000000',
        extensionsDataLength: 1,
        isSignedRequest: false,
      },
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
  extensions: extensionStateCreatedEmpty,
  extensionsData: [actionCreationEmpty],
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: TestData.payerRaw.address,
  },
  requestId: TestData.requestIdMock,
  state: Types.STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version: '0.1.0',
};

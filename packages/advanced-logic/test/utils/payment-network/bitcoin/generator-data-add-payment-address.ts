import * as TestDataCreate from './generator-data-create';

import * as TestData from '../../test-data-generator';

import {
  Extension as ExtensionTypes,
  Identity as IdentityTypes,
  RequestLogic as Types,
} from '@requestnetwork/types';

// ---------------------------------------------------------------------
// BTC address
export const paymentBTCAddress = 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v';
export const refundBTCAddress = 'mfsSPZdcdXwSMVkPwCsiW39P5y6eYE1bDM';

// ---------------------------------------------------------------------
// actions
export const actionAddPaymentAddress = {
  action: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_PAYMENT_ADDRESS,
  id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
  parameters: {
    paymentAddress: paymentBTCAddress,
  },
};
export const actionAddRefundAddress = {
  action: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_REFUND_ADDRESS,
  id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
  parameters: {
    refundAddress: refundBTCAddress,
  },
};

// ---------------------------------------------------------------------
// extensions states
export const extensionStateWithPaymentAfterCreation = {
  [ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED as string]: {
    events: [
      {
        name: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.CREATE,
        parameters: {},
      },
      {
        name: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_PAYMENT_ADDRESS,
        parameters: {
          paymentAddress: paymentBTCAddress,
        },
      },
    ],
    id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
    type: ExtensionTypes.EXTENSION_TYPE.PAYMENT_NETWORK,
    values: {
      paymentAddress: paymentBTCAddress,
    },
    version: '0.1.0',
  },
};

export const extensionStateWithRefundAfterCreation = {
  [ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED as string]: {
    events: [
      {
        name: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.CREATE,
        parameters: {},
      },
      {
        name: ExtensionTypes.PnBitcoinAddressBased.PN_BTC_ADDRESS_BASED_ACTION.ADD_REFUND_ADDRESS,
        parameters: {
          refundAddress: refundBTCAddress,
        },
      },
    ],
    id: ExtensionTypes.EXTENSION_ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
    type: ExtensionTypes.EXTENSION_TYPE.PAYMENT_NETWORK,
    values: {
      refundAddress: refundBTCAddress,
    },
    version: '0.1.0',
  },
};

// ---------------------------------------------------------------------
// request states
export const requestStateCreatedEmptyThenAddPayment: Types.IRequestLogicRequest = {
  creator: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: Types.REQUEST_LOGIC_CURRENCY.BTC,
  events: [
    {
      actionSigner: {
        type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: TestData.payeeRaw.address,
      },
      name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
      parameters: {
        expectedAmount: '123400000000000000',
        extensionsDataLength: 2,
        isSignedRequest: false,
      },
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
  extensions: extensionStateWithPaymentAfterCreation,
  extensionsData: [TestDataCreate.actionCreationEmpty, actionAddPaymentAddress],
  payee: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payerRaw.address,
  },
  requestId: TestData.requestIdMock,
  state: Types.REQUEST_LOGIC_STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version: '0.1.0',
};

export const requestStateCreatedEmptyThenAddRefund: Types.IRequestLogicRequest = {
  creator: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  currency: Types.REQUEST_LOGIC_CURRENCY.BTC,
  events: [
    {
      actionSigner: {
        type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: TestData.payeeRaw.address,
      },
      name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
      parameters: {
        expectedAmount: '123400000000000000',
        extensionsDataLength: 2,
        isSignedRequest: false,
      },
    },
  ],
  expectedAmount: TestData.arbitraryExpectedAmount,
  extensions: extensionStateWithRefundAfterCreation,
  extensionsData: [TestDataCreate.actionCreationEmpty, actionAddRefundAddress],
  payee: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payeeRaw.address,
  },
  payer: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: TestData.payerRaw.address,
  },
  requestId: TestData.requestIdMock,
  state: Types.REQUEST_LOGIC_STATE.CREATED,
  timestamp: TestData.arbitraryTimestamp,
  version: '0.1.0',
};
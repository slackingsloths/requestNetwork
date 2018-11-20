import { expect } from 'chai';
import 'mocha';

import { RequestLogic as Types } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Transaction from '../../src/transaction';

import Version from '../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from './utils/test-data-generator';

const randomTx = {
  action: Types.REQUEST_LOGIC_ACTION.CREATE,
  parameters: {
    currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
    expectedAmount: '100000',
    payee: TestData.payeeRaw.identity,
    payer: TestData.payerRaw.identity,
  },
  version: CURRENT_VERSION,
};

/* tslint:disable:no-unused-expression */
describe('Transaction', () => {
  it('can getRequestId()', () => {
    const signedTx = {
      data: randomTx,
      signature: {
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        value:
          '0x7467bc1cbe63ed703c5037820635deeceb1f929daee44d0e62e4e1c78fdb70ee5370ce01e57a06455a12c9cfed8b8c0df010cb78ffa0ddecafc1fbda503a23f11b',
      },
    };
    const reqId = Transaction.getRequestId(signedTx);
    expect(reqId, 'getRequestId() error').to.be.equal(
      Utils.crypto.normalizeKeccak256Hash(signedTx),
    );
  });

  it('can getRoleInTransaction()', () => {
    expect(
      Transaction.getRoleInTransaction(TestData.payeeRaw.identity, randomTx),
      'getRoleInTransaction() error',
    ).to.be.deep.equal(Types.REQUEST_LOGIC_ROLE.PAYEE);
    expect(
      Transaction.getRoleInTransaction(TestData.payerRaw.identity, randomTx),
      'getRoleInTransaction() error',
    ).to.be.deep.equal(Types.REQUEST_LOGIC_ROLE.PAYER);
    expect(
      Transaction.getRoleInTransaction(TestData.otherIdRaw.identity, randomTx),
      'getRoleInTransaction() error',
    ).to.be.deep.equal(Types.REQUEST_LOGIC_ROLE.THIRD_PARTY);
  });

  it('can createTransaction()', () => {
    const tx = Transaction.createTransaction(randomTx, {
      method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
      privateKey: TestData.payeeRaw.privateKey,
    });

    expect(tx.signature, 'createTransaction() signature error').to.be.deep.equal({
      method: 'ecdsa',
      value:
        '0x7467bc1cbe63ed703c5037820635deeceb1f929daee44d0e62e4e1c78fdb70ee5370ce01e57a06455a12c9cfed8b8c0df010cb78ffa0ddecafc1fbda503a23f11b',
    });

    expect(tx.data, 'createTransaction() transaction error').to.be.deep.equal(randomTx);
  });

  it('can getSignerIdentityFromTransaction()', () => {
    const id = Transaction.getSignerIdentityFromTransaction({
      data: randomTx,
      signature: {
        method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
        value:
          '0x7467bc1cbe63ed703c5037820635deeceb1f929daee44d0e62e4e1c78fdb70ee5370ce01e57a06455a12c9cfed8b8c0df010cb78ffa0ddecafc1fbda503a23f11b',
      },
    });
    expect(id, 'recover() error').to.be.deep.equal(TestData.payeeRaw.identity);
  });

  it('can isTransactionVersionSupported()', () => {
    expect(
      Transaction.isTransactionVersionSupported(randomTx),
      'isTransactionVersionSupported() error',
    ).to.be.true;

    const wrongVersionTx = Utils.deepCopy(randomTx);
    wrongVersionTx.version = '10.0.0';
    expect(
      Transaction.isTransactionVersionSupported(wrongVersionTx),
      'isTransactionVersionSupported() error',
    ).to.be.false;
  });

  it('can getVersionFromTransaction()', () => {
    expect(
      Transaction.getVersionFromTransaction({
        data: randomTx,
        signature: {
          method: Types.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
          value:
            '0x7467bc1cbe63ed703c5037820635deeceb1f929daee44d0e62e4e1c78fdb70ee5370ce01e57a06455a12c9cfed8b8c0df010cb78ffa0ddecafc1fbda503a23f11b',
        },
      }),
      'getVersionFromTransaction() error',
    ).to.be.equal(CURRENT_VERSION);
  });
});

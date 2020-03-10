import 'mocha';

import { EncryptionTypes, IdentityTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import MnemonicDecryptionProvider from '../src/mnemonic-decryption-provider';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const expect = chai.expect;

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';

export const id1Raw = {
  address: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  decryptionParams: {
    key: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
    method: EncryptionTypes.METHOD.ECIES,
  },
  encryptionParams: {
    key:
      'af80b90d25145da28c583359beb47b21796b2fe1a23c1511e443e7a64dfdb27d7434c380f0aa4c500e220aa1a9d068514b1ff4d5019e624e7ba1efe82b340a59',
    method: EncryptionTypes.METHOD.ECIES,
  },
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  publicKey:
    'af80b90d25145da28c583359beb47b21796b2fe1a23c1511e443e7a64dfdb27d7434c380f0aa4c500e220aa1a9d068514b1ff4d5019e624e7ba1efe82b340a59',
};

export const id2Raw = {
  address: '0xf17f52151ebef6c7334fad080c5704d77216b732',
  decryptionParams: {
    key: '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
    method: EncryptionTypes.METHOD.ECIES,
  },
  encryptionParams: {
    key:
      'ce7edc292d7b747fab2f23584bbafaffde5c8ff17cf689969614441e0527b90015ea9fee96aed6d9c0fc2fbe0bd1883dee223b3200246ff1e21976bdbc9a0fc8',
    method: EncryptionTypes.METHOD.ECIES,
  },
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
  },
  privateKey: '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
  publicKey:
    'ce7edc292d7b747fab2f23584bbafaffde5c8ff17cf689969614441e0527b90015ea9fee96aed6d9c0fc2fbe0bd1883dee223b3200246ff1e21976bdbc9a0fc8',
};

const decryptedDataExpected = JSON.stringify({
  attribut1: 'VALUE',
  attribut2: 'Value',
});

// tslint:disable:no-magic-numbers
/* tslint:disable:no-unused-expression */
describe('mnemonic-decryption-provider', () => {
  describe('constructor', () => {
    it('can construct', async () => {
      const decryptionProvider = new MnemonicDecryptionProvider(
        'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat',
      );

      expect(
        decryptionProvider.supportedIdentityTypes,
        'decryptionProvider.supportedIdentityTypes is wrong',
      ).to.be.deep.equal([IdentityTypes.TYPE.ETHEREUM_ADDRESS]);
      expect(
        decryptionProvider.supportedMethods,
        'decryptionProvider.supportedMethods is wrong',
      ).to.be.deep.equal([EncryptionTypes.METHOD.ECIES]);
      expect(
        decryptionProvider.getAllRegisteredIdentities().length,
        'getAllRegisteredIdentities is wrong',
      ).to.be.deep.equal(100);
    });
  });

  describe('decrypt', () => {
    it('can decrypt', async () => {
      const encryptedData = await Utils.encryption.encrypt(
        decryptedDataExpected,
        id1Raw.encryptionParams,
      );

      const decryptionProvider = new MnemonicDecryptionProvider(mnemonic);

      const decryptedData: string = await decryptionProvider.decrypt(
        encryptedData,
        id1Raw.identity,
      );

      expect(decryptedData, 'decryptedData is wrong').to.be.deep.equal(decryptedDataExpected);
    });

    it('cannot decrypt if encryption not supported', async () => {
      const encryptedData = { type: EncryptionTypes.METHOD.AES256_CBC, value: '0000000' };
      const decryptionProvider = new MnemonicDecryptionProvider(mnemonic);
      await expect(
        decryptionProvider.decrypt(encryptedData, id1Raw.identity),
        'should throw',
      ).to.eventually.be.rejectedWith(
        `The data must be encrypted with ${EncryptionTypes.METHOD.ECIES}`,
      );
    });

    it('cannot decrypt if identity not supported', async () => {
      const encryptedData = await Utils.encryption.encrypt(
        decryptedDataExpected,
        id1Raw.encryptionParams,
      );
      const decryptionProvider = new MnemonicDecryptionProvider(mnemonic);

      const arbitraryIdentity: any = { type: 'unknown type', value: '0x000' };
      await expect(
        decryptionProvider.decrypt(encryptedData, arbitraryIdentity),
        'should throw',
      ).to.eventually.be.rejectedWith('Identity type not supported unknown type');
    });

    it('cannot decrypt if private key of the identity not given', async () => {
      const encryptedData = await Utils.encryption.encrypt(
        decryptedDataExpected,
        id1Raw.encryptionParams,
      );
      const decryptionProvider = new MnemonicDecryptionProvider(mnemonic);

      const arbitraryIdentity: IdentityTypes.IIdentity = {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0x000',
      };
      await expect(
        decryptionProvider.decrypt(encryptedData, arbitraryIdentity),
        'should throw',
      ).to.eventually.be.rejectedWith('private key unknown for the identity: 0x000');
    });
  });

  describe('isIdentityRegistered', () => {
    it('can check if an identity is registered', async () => {
      const decryptionProvider = new MnemonicDecryptionProvider(mnemonic);

      expect(
        await decryptionProvider.isIdentityRegistered(id1Raw.identity),
        'id1Raw must be registered',
      ).to.be.true;
    });

    it('can check if an identity is NOT registered', async () => {
      const decryptionProvider = new MnemonicDecryptionProvider(mnemonic);

      expect(
        await decryptionProvider.isIdentityRegistered({
          type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
          value: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        }),
        'must not be registered',
      ).to.be.false;
    });
  });

  describe('getEncryptionParameterFromRegisteredIdentity', () => {
    it('can get EncryptionParam if an identity is registered', async () => {
      const decryptionProvider = new MnemonicDecryptionProvider(mnemonic);

      expect(
        decryptionProvider.getEncryptionParameterFromRegisteredIdentity(id1Raw.identity),
        'id1Raw must be registered',
      ).to.be.deep.equal(id1Raw.encryptionParams);
    });

    it('cannot get EncryptionParam if an identity is NOT registered', async () => {
      const decryptionProvider = new MnemonicDecryptionProvider(mnemonic);

      expect(
        () =>
          decryptionProvider.getEncryptionParameterFromRegisteredIdentity({
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          }),
        'should throw',
      ).to.throws(`The identity is not registered`);
    });
  });

  describe('generateMoreAddresses', () => {
    it('can generate more addresses', async () => {
      const decryptionProvider = new MnemonicDecryptionProvider(mnemonic);

      decryptionProvider.generateDecryptionParameters(100);
      expect(
        decryptionProvider.getAllRegisteredIdentities().length,
        'getAllRegisteredIdentities is wrong',
      ).to.be.deep.equal(200);

      decryptionProvider.generateDecryptionParameters(100);
      expect(
        decryptionProvider.getAllRegisteredIdentities().length,
        'getAllRegisteredIdentities is wrong',
      ).to.be.deep.equal(300);
    });
  });
});

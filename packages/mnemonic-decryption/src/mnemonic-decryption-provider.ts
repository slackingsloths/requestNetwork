import * as bip39 from 'bip39';

import { DecryptionProviderTypes, EncryptionTypes, IdentityTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

// eslint-disable-next-line spellcheck/spell-checker
const ethereumHDKey = require('ethereumjs-wallet/hdkey');

/** Type of the dictionary of decryptionParameters (private keys) indexed by ethereum address */
type IDecryptionParametersDictionary = Map<string, EncryptionTypes.IDecryptionParameters>;

/**
 * Implementation of the decryption provider from mnemonic
 * Allows to decrypt() with "ethereumAddress" identities thanks to the mnemonic given in constructor() or addDecryptionParameters()
 */
export default class MnemonicDecryptionProvider
  implements DecryptionProviderTypes.IDecryptionProvider {
  /** list of supported encryption method */
  public supportedMethods: EncryptionTypes.METHOD[] = [EncryptionTypes.METHOD.ECIES];
  /** list of supported identity types */
  public supportedIdentityTypes: IdentityTypes.TYPE[] = [IdentityTypes.TYPE.ETHEREUM_ADDRESS];

  /** Dictionary containing all the private keys indexed by address */
  private decryptionParametersDictionary: IDecryptionParametersDictionary;

  private hdWallet?: any;
  private walletHdPath: string;
  private lastIndex: number;

  constructor(
    mnemonic: string | string[],
    startIndex: number = 0,
    numberOfDecryptionParams: number = 100,
    walletHdPath: string = `m/44'/60'/0'/0/`,
  ) {
    this.walletHdPath = walletHdPath;
    // initiate to the minIndex as we did not create the decryption params yet (will be done in generateDecryptionParameters())
    this.lastIndex = startIndex;
    this.decryptionParametersDictionary = new Map<string, EncryptionTypes.IDecryptionParameters>();

    const normalizedMnemonic = this.normalizeMnemonic(mnemonic);

    if (!bip39.validateMnemonic(normalizedMnemonic)) {
      throw new Error('Invalid or undefined mnemonic ');
    }

    const seed = bip39.mnemonicToSeedSync(normalizedMnemonic);
    this.hdWallet = ethereumHDKey.fromMasterSeed(seed);

    this.generateDecryptionParameters(numberOfDecryptionParams);
  }

  /**
   * Decrypts data
   *
   * @param data the encrypted data
   * @param identity identity to decrypt with
   *
   * @returns the data decrypted
   */
  public async decrypt(
    encryptedData: EncryptionTypes.IEncryptedData,
    identity: IdentityTypes.IIdentity,
  ): Promise<string> {
    if (encryptedData.type !== EncryptionTypes.METHOD.ECIES) {
      throw Error(`The data must be encrypted with ${EncryptionTypes.METHOD.ECIES}`);
    }

    if (!this.supportedIdentityTypes.includes(identity.type)) {
      throw Error(`Identity type not supported ${identity.type}`);
    }

    // toLowerCase to avoid mismatch because of case
    const decryptionParameters:
      | EncryptionTypes.IDecryptionParameters
      | undefined = this.decryptionParametersDictionary.get(identity.value.toLowerCase());

    if (!decryptionParameters) {
      throw Error(`private key unknown for the identity: ${identity.value}`);
    }

    return Utils.encryption.decrypt(encryptedData, decryptionParameters);
  }

  /**
   * Check if an identity is registered in the provider
   *
   * @param identity identity to check
   *
   * @returns true if the identity is registered, false otherwise
   */
  public async isIdentityRegistered(identity: IdentityTypes.IIdentity): Promise<boolean> {
    return Array.from(this.decryptionParametersDictionary.keys()).some(
      address => identity.value.toLowerCase() === address.toLowerCase(),
    );
  }

  /**
   * Removes all private keys from the provider
   *
   * @param identity identity to remove the private key
   *
   * @returns void
   */
  public clearAllRegisteredIdentities(): void {
    this.decryptionParametersDictionary.clear();
  }

  /**
   * Gets all the identities available to decrypt with
   *
   * @returns all the identities registered
   */
  public getAllRegisteredIdentities(): IdentityTypes.IIdentity[] {
    return Array.from(this.decryptionParametersDictionary.keys(), address => ({
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: address,
    }));
  }

  /**
   * Generates more Decryption Parameters to decrypt with
   *
   * @param numberToGenerate number of new identity to generate
   */
  public generateDecryptionParameters(numberToGenerate: number): void {
    this.generateHdWalletBIP39(this.lastIndex, this.lastIndex + numberToGenerate);
    this.lastIndex = this.lastIndex + numberToGenerate;
  }

  /**
   * Gets the public key of an registered identity
   *
   * @param identity identity to get the public key
   *
   * @returns public key in hex
   */
  public getEncryptionParameterFromRegisteredIdentity(
    identity: IdentityTypes.IIdentity,
  ): EncryptionTypes.IEncryptionParameters {
    const decryptionParam:
      | EncryptionTypes.IDecryptionParameters
      | undefined = this.decryptionParametersDictionary.get(identity.value.toLowerCase());

    if (!decryptionParam || !this.isIdentityRegistered(identity)) {
      throw Error(`The identity is not registered`);
    }

    return {
      key: Utils.crypto.EcUtils.getPublicKeyFromPrivateKey(decryptionParam.key),
      method: EncryptionTypes.METHOD.ECIES,
    };
  }

  /**
   * Generates the HD Wallet from BIP39 mnemonic
   *
   * @param startIndex starting index to generate the new decryption parameters
   * @param stopIndex stopping index
   */
  private generateHdWalletBIP39(startIndex: number, stopIndex: number): void {
    // Derive the private key to create decryption parameters
    for (let i = startIndex; i < stopIndex; i++) {
      const wallet = this.hdWallet.derivePath(this.walletHdPath + i.toString()).getWallet();
      const address = `0x${wallet.getAddress().toString('hex')}`;

      this.decryptionParametersDictionary.set(address, {
        // eslint-disable-next-line spellcheck/spell-checker
        key: `0x${wallet.privKey.toString('hex')}`,
        method: EncryptionTypes.METHOD.ECIES,
      });
    }
  }

  /**
   * Normalizes a mnemonic
   *
   * @param mnemonic mnemonic as a string separate by space or as an array
   *
   * @returns the mnemonic with a string separated by spaces
   */
  private normalizeMnemonic(mnemonic: string | string[]): string {
    if (Array.isArray(mnemonic)) {
      return mnemonic.join(' ');
    } else if (mnemonic && mnemonic.includes(' ')) {
      return mnemonic;
    }
    throw Error('mnemonic must be an array or a string separated by spaces');
  }
}

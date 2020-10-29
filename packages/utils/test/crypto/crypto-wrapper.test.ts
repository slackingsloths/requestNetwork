import CryptoWrapper from '../../src/crypto/crypto-wrapper';
import utils from '../../src/utils';

const anyData = 'this is any data!';
const arbitraryKey = '12345678901234567890123456789012';

const id2MmRaw = {
  encryptionParams: {
    key:
      'I2h89PhVzI0b0+D7gItzJz+UJ6yWv22PjGq7pODT/1E='
  },
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
};

/* tslint:disable:no-unused-expression */
describe('Utils.cryptoWrapper', () => {
  describe('random32Bytes', () => {
    it('can create a 32 bytes buffer', async () => {
      const randomBytes = await CryptoWrapper.random32Bytes();
      // 'random32Bytes() error'
      expect(Buffer.isBuffer(randomBytes)).toBe(true);
      // tslint:disable-next-line:no-magic-numbers
      // 'random32Bytes() error'
      expect(randomBytes.length).toBe(32);
    });

    it(
      'can create 1000 buffers with no duplicates random32Bytes()',
      async () => {
        // tslint:disable-next-line:no-magic-numbers
        const promises = new Array(1000).fill('').map(async () => CryptoWrapper.random32Bytes());
        const randomBytes1000 = await Promise.all(promises);
        // 'randomBytes gives duplicate'
        expect(utils.unique(randomBytes1000).duplicates.length).toBe(0);
      }
    );
  });

  describe('encryptWithAes256cbc', () => {
    it('can encrypt with the aes256-cbc algorithm', async () => {
      const encrypted = await CryptoWrapper.encryptWithAes256cbc(
        Buffer.from(anyData, 'utf8'),
        Buffer.from(arbitraryKey, 'utf8'),
      );
      // 'encryptWithAes256cbc() error'
      expect(Buffer.isBuffer(encrypted)).toBe(true);
      // 'encryptWithAes256cbc() error'
      expect(encrypted.length).toBe(48);

      // 'decrypt() error'
      expect(
        await CryptoWrapper.decryptWithAes256cbc(encrypted, Buffer.from(arbitraryKey, 'utf8'))
      ).toEqual(Buffer.from(anyData, 'utf8'));
    });
  });

  describe('decryptWithAes256cbc', () => {
    it(
      'can decrypt a message encrypted with the aes256-cbc algorithm',
      async () => {
        const decrypted = await CryptoWrapper.decryptWithAes256cbc(
          Buffer.from('GAM/RiH/7R0MZC03cviYHQmCdH8VrBEAPAhSt2j+IH9ZNCZiut/JtZbVYmcslyWa', 'base64'),
          Buffer.from(arbitraryKey, 'utf8'),
        );
        // 'decryptWithAes256cbc() error'
        expect(Buffer.isBuffer(decrypted)).toBe(true);
        // 'decryptWithAes256cbc() error'
        expect(decrypted).toEqual(Buffer.from(anyData, 'utf8'));
      }
    );
  });

  describe('encryptWithAes256gcm', () => {
    it('can encrypt with the aes256-gcm algorithm', async () => {
      const encrypted = await CryptoWrapper.encryptWithAes256gcm(
        Buffer.from(anyData, 'utf8'),
        Buffer.from(arbitraryKey, 'utf8'),
      );
      // 'encryptWithAes256gcm() error'
      expect(Buffer.isBuffer(encrypted)).toBe(true);
      // 'encryptWithAes256gcm() error'
      expect(encrypted.length).toBe(49);
      // 'decrypt() error'
      expect(
        await CryptoWrapper.decryptWithAes256gcm(encrypted, Buffer.from(arbitraryKey, 'utf8'))
      ).toEqual(Buffer.from(anyData, 'utf8'));
    });
  });
  describe('decryptWithAes256gcm', () => {
    it(
      'can decrypt a message encrypted with the aes256-gcm algorithm',
      async () => {
        const decrypted = await CryptoWrapper.decryptWithAes256gcm(
          Buffer.from(
            'TTu/6w1cLS6ToK68ILt56eJ/dJGGbo+z/IwGLEg0WfD/naOONpInlrzQ2Zv1vYL+Vg==',
            'base64',
          ),
          Buffer.from(arbitraryKey, 'utf8'),
        );
        // 'decryptWithAes256gcm() error'
        expect(Buffer.isBuffer(decrypted)).toBe(true);
        // 'decryptWithAes256gcm() error'
        expect(decrypted).toEqual(Buffer.from(anyData, 'utf8'));
      }
    );
  });

  describe('encryptWithXsalsa20Poly1350', () => {
    it('can encrypt with the Xsalsa20Poly1350 algorithm', async () => {

      const encrypted = await CryptoWrapper.encryptWithXsalsa20Poly1350(
        anyData,
        id2MmRaw.encryptionParams.key,
      );
      
      expect(Buffer.isBuffer(encrypted)).toBe(true);
      const privKey = Buffer.from(id2MmRaw.privateKey);

       expect(
        await CryptoWrapper.decryptWithXsalsa20Poly1350(encrypted, privKey)
      ).toEqual(Buffer.from(anyData, 'utf8')); 
    });
  });
  describe('decryptWithXsalsa20Poly1350', () => {
    it(
      'can decrypt a message encrypted with the Xsalsa20Poly1350 algorithm',
      async () => {

        // utf8 content of hex buffer below
        /* {
          "version": "x25519-xsalsa20-poly1305",
          "nonce": "q7jQygbjJn3mY6w+JfM0iAd8s9dmXMME",
          "ephemPublicKey": "xFajUp7fLJxobG8KI89/OtNeSsMRa/RSwgv36Ampcys=",
          "ciphertext": "b4eYsKYszMhfOFrwH0AC9ctueCTgfjYOXmae2bNCPz08"
        } */

        const decrypted = await CryptoWrapper.decryptWithXsalsa20Poly1350(
          Buffer.from(
            '7b2276657273696f6e223a227832353531392d7873616c736132302d706f6c7931333035222c226e6f6e6365223a2271376a517967626a4a6e336d5936772b4a664d30694164387339646d584d4d45222c22657068656d5075626c69634b6579223a227846616a557037664c4a786f6247384b4938392f4f744e6553734d52612f52537767763336416d706379733d222c2263697068657274657874223a2262346559734b59737a4d68664f467277483041433963747565435467666a594f586d616532624e43507a3038227d',
            'hex',
          ),
          Buffer.from(id2MmRaw.privateKey, 'utf-8'),
        );

        expect(Buffer.isBuffer(decrypted)).toBe(true);
        expect(decrypted).toEqual(Buffer.from(anyData, 'utf8'));
      }
    );
  });



});

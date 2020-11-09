import { EncryptionTypes, MultiFormatTypes } from '@requestnetwork/types';

import SerializableMultiFormat from '../serializable-multi-format';

/**
 * Class to serialize and deserialize multi-format XSALSA20_POLY1305 encrypted data
 */
export default class XSalsaMultiFormat extends SerializableMultiFormat {
  constructor() {
    super(
      MultiFormatTypes.prefix.XSALSA20_POLY1305_ENCRYPTED,
      EncryptionTypes.METHOD.XSALSA20_POLY1305,
    );
  }
}

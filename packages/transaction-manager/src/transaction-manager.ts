import {
  DataAccess as DataAccessTypes,
  Signature as SignatureTypes,
  Transaction as Types,
} from '@requestnetwork/types';

import TransactionCore from './transaction';

/**
 * Implementation of TransactionManager layer without encryption
 */
export default class TransactionManager implements Types.ITransactionManager {
  private dataAccess: DataAccessTypes.IDataAccess;

  public constructor(dataAccess: DataAccessTypes.IDataAccess) {
    this.dataAccess = dataAccess;
  }

  /**
   * Function to persist transaction and topic in storage
   *
   * later it will handle encryption
   *
   * @param string transaction transaction to persist
   * @param string[] topics list of string to topic the transaction
   *
   * @returns string dataId where the transaction is stored
   */
  public async persistTransaction(
    transactionData: Types.ITransactionData,
    signatureParams: SignatureTypes.ISignatureParameters,
    topics: string[] = [],
  ): Promise<Types.IRequestDataReturnPersistTransaction> {
    const transaction: Types.ITransaction = TransactionCore.createTransaction(
      transactionData,
      signatureParams,
    );

    const resultPersist = await this.dataAccess.persistTransaction(transaction, topics);

    return {
      meta: {
        dataAccessMeta: resultPersist.meta,
      },
      result: {},
    };
  }

  /**
   * Function to get a list of transactions indexed by topic
   *
   * later it will handle decryption
   *
   * @param string topic topic to retrieve the transaction from
   *
   * @returns IRequestDataAccessTransaction list of transactions indexed by topic
   */
  public async getTransactionsByTopic(
    topic: string,
  ): Promise<Types.IRequestDataReturnGetTransactionsByTopic> {
    const resultGetTx = await this.dataAccess.getTransactionsByTopic(topic);

    return {
      meta: {
        dataAccessMeta: resultGetTx.meta,
      },
      result: resultGetTx.result,
    };
  }
}
import Utils from '@requestnetwork/utils';
import Amount from '../amount';
import * as RequestEnum from '../enum';
import Signature from '../signature';
import Transaction from '../transaction';
import * as Types from '../types';
import Version from '../version';

/**
 * Implementation of the request logic specification
 */
export default {
  createRequest,
  format,
};

/**
 * Function to format  transaction to create a Request
 *
 * @param enum currency Currency of the Request (e.g: 'ETH', 'BTC', 'REQ', etc..)
 * @param Amount expectedAmount Amount initial expected for the request
 * @param ISignatureParameters signatureParams Signature parameters
 * @param IIdentity payee Payee id of the request - optional if payer given
 * @param IIdentity payer Payer id of the request - optional if payee given
 * @param any[] extensions List of extensions used by the request
 *
 * @returns ISignedTransaction  the transaction with the signature
 */
function format(
  requestParameters: Types.IRequestLogicRequestCreateParameters,
  signatureParams: Types.IRequestLogicSignatureParameters,
): Types.IRequestLogicSignedTransaction {
  if (!requestParameters.payee && !requestParameters.payer) {
    throw new Error('payee or PayerId must be given');
  }

  if (!Amount.isValid(requestParameters.expectedAmount)) {
    throw new Error('expectedAmount must be a positive integer');
  }

  if (
    requestParameters.payee &&
    requestParameters.payee.type !== RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS
  ) {
    throw new Error('payee.type not supported');
  }

  if (
    requestParameters.payer &&
    requestParameters.payer.type !== RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS
  ) {
    throw new Error('payer.type not supported');
  }

  // convert expectedAmount to string to have a consistent numbering
  requestParameters.expectedAmount = requestParameters.expectedAmount.toString();
  const version = Version.currentVersion;

  const transaction: Types.IRequestLogicTransaction = {
    action: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
    parameters: requestParameters,
    version,
  };
  const signerIdentity: Types.IRequestLogicIdentity = Signature.getIdentityFromSignatureParams(
    signatureParams,
  );
  const signerRole: RequestEnum.REQUEST_LOGIC_ROLE = Transaction.getRoleInTransaction(
    signerIdentity,
    transaction,
  );

  if (
    signerRole !== RequestEnum.REQUEST_LOGIC_ROLE.PAYEE &&
    signerRole !== RequestEnum.REQUEST_LOGIC_ROLE.PAYER
  ) {
    throw new Error('Signer must be the payee or the payer');
  }

  return Transaction.createSignedTransaction(transaction, signatureParams);
}

/**
 * Function to create a request (create a request)
 *
 * @param Types.IRequestLogicSignedTransaction signedTransaction the signed transaction to evaluate
 *
 * @returns Types.IRequestLogicRequest the new request
 */
function createRequest(
  signedTransaction: Types.IRequestLogicSignedTransaction,
): Types.IRequestLogicRequest {
  const transaction = signedTransaction.transaction;

  if (!transaction.parameters.payee && !transaction.parameters.payer) {
    throw new Error('transaction.parameters.payee or transaction.parameters.payer must be given');
  }

  if (
    !Utils.isString(transaction.parameters.expectedAmount) ||
    !Amount.isValid(transaction.parameters.expectedAmount)
  ) {
    throw new Error(
      'transaction.parameters.expectedAmount must be a string representing a positive integer',
    );
  }

  const signer: Types.IRequestLogicIdentity = Transaction.getSignerIdentityFromSignedTransaction(
    signedTransaction,
  );

  // Copy to not modify the transaction itself
  const request: Types.IRequestLogicRequest = Utils.deepCopy(transaction.parameters);
  request.requestId = Transaction.getRequestId(transaction);
  request.version = Transaction.getVersionFromTransaction(transaction);

  const signerRole = Transaction.getRoleInTransaction(signer, transaction);
  if (signerRole === RequestEnum.REQUEST_LOGIC_ROLE.PAYEE) {
    request.state = RequestEnum.REQUEST_LOGIC_STATE.CREATED;
    request.creator = transaction.parameters.payee;
    return request;
  }
  if (signerRole === RequestEnum.REQUEST_LOGIC_ROLE.PAYER) {
    request.state = RequestEnum.REQUEST_LOGIC_STATE.ACCEPTED;
    request.creator = transaction.parameters.payer;
    return request;
  }

  throw new Error('Signer must be the payee or the payer');
}
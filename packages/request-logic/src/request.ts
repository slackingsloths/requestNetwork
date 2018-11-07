import Amount from './amount';
import * as RequestEnum from './enum';
import Role from './role';
import Signature from './signature';
import * as Types from './types';

/**
 * Module to manage a request
 */
export default {
  checkRequest,
  getRoleInRequest,
  pushExtensions,
};

/**
 * Function to get the role of an identity in a request
 *
 * @param IIdentity identity the identity to check
 * @param IRequestLogicRequest request the request
 *
 * @returns RequestEnum.REQUEST_LOGIC_ROLE the role of the signer (payee, payer or thirdpart)
 */
function getRoleInRequest(
  identity: Types.IRequestLogicIdentity,
  request: Types.IRequestLogicRequest,
): RequestEnum.REQUEST_LOGIC_ROLE {
  return Role.getRole(identity, request);
}

/**
 * Function to check if a request context is valid
 *
 * @param IRequestLogicRequest request the request to check
 *
 * @returns boolean true if the request is valid, throw otherwise
 */
function checkRequest(request: Types.IRequestLogicRequest): boolean {
  const errors: string[] = [];
  if (!request.payee && !request.payer) {
    throw Error('request.payee or/and request.payer are missing');
  }
  if (request.creator.type !== RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS) {
    throw Error('request.creator.type not supported');
  }
  if (
    request.payee &&
    request.payee.type !== RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS
  ) {
    throw Error('request.payee.type not supported');
  }
  if (
    request.payer &&
    request.payer.type !== RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS
  ) {
    throw Error('request.payer.type not supported');
  }
  if (!Amount.isValid(request.expectedAmount)) {
    throw Error('expectedAmount must be a positive integer');
  }
  return true;
}

/**
 * Function to simply add the extensions data to the request
 *
 * @param Types.IRequestLogicRequest requestContext The current request context
 * @param Types.IRequestLogicRequest extensions The extensions data to add to the request
 *
 * @returns Types.IRequestLogicRequest The request context with the extensions data added
 */
function pushExtensions(
  requestContext: Types.IRequestLogicRequest,
  extensions?: any[],
): Types.IRequestLogicRequest {
  if (extensions) {
    requestContext.extensions = (requestContext.extensions || []).concat(extensions);
  }
  return requestContext;
}
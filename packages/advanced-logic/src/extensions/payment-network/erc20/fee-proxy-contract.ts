import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import Erc20ProxyPaymentNetwork from './proxy-contract';

const CURRENT_VERSION = '0.1.0';

const supportedNetworks = ['mainnet', 'rinkeby', 'private'];

/**
 * Implementation of the payment network to pay in ERC20, including third-party fees payment, based on a reference provided to a proxy contract.
 * With this extension, one request can have three Ethereum addresses (one for payment, one for fees payment, and one for refund)
 * Every ERC20 ethereum transaction that reaches these addresses through the proxy contract and has the correct reference will be interpreted as a payment or a refund.
 * The value to give as input data is the last 8 bytes of a salted hash of the requestId and the address: `last8Bytes(hash(requestId + salt + address))`:
 * The salt should have at least 8 bytes of randomness. A way to generate it is:
 *   `Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16) + Math.floor(Math.random() * Math.pow(2, 4 * 8)).toString(16)`
 */
export default class Erc20FeeProxyPaymentNetwork extends Erc20ProxyPaymentNetwork {
  public constructor() {
    super();
    this.currentVersion = CURRENT_VERSION;
    this.paymentNetworkId = ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT;
    this.actions = {
      ...this.actions,
      [ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE]: this.applyAddFee,
    };
  }

  /**
   * Creates the extensionsData to create the extension ERC20 fee proxy contract payment detection
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: ExtensionTypes.PnFeeReferenceBased.ICreationParameters,
  ): ExtensionTypes.IAction<ExtensionTypes.PnFeeReferenceBased.ICreationParameters> {
    if (
      creationParameters.feeAddress &&
      !Erc20ProxyPaymentNetwork.isValidAddress(creationParameters.feeAddress)
    ) {
      throw Error('feeAddress is not a valid ethereum address');
    }

    if (creationParameters.feeAmount && !Utils.amount.isValid(creationParameters.feeAmount)) {
      throw Error('feeAmount is not a valid amount');
    }

    if (!creationParameters.feeAmount && creationParameters.feeAddress) {
      throw Error('feeAmount requires feeAddress');
    }
    if (creationParameters.feeAmount && !creationParameters.feeAddress) {
      throw Error('feeAddress requires feeAmount');
    }

    return super.createCreationAction(creationParameters);
  }

  /**
   * Creates the extensionsData to add a fee address
   *
   * @param addFeeParameters extensions parameters to create
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createAddFeeAction(
    addFeeParameters: ExtensionTypes.PnFeeReferenceBased.IAddFeeParameters,
  ): ExtensionTypes.IAction {
    if (
      addFeeParameters.feeAddress &&
      !Erc20ProxyPaymentNetwork.isValidAddress(addFeeParameters.feeAddress)
    ) {
      throw Error('feeAddress is not a valid ethereum address');
    }

    if (addFeeParameters.feeAmount && !Utils.amount.isValid(addFeeParameters.feeAmount)) {
      throw Error('feeAmount is not a valid amount');
    }

    if (!addFeeParameters.feeAmount && addFeeParameters.feeAddress) {
      throw Error('feeAmount requires feeAddress');
    }
    if (addFeeParameters.feeAmount && !addFeeParameters.feeAddress) {
      throw Error('feeAddress requires feeAmount');
    }

    return {
      action: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
      id: this.paymentNetworkId,
      parameters: addFeeParameters,
    };
  }

  /**
   * Applies a creation extension action
   *
   * @param extensionAction action to apply
   * @param timestamp action timestamp
   *
   * @returns state of the extension created
   */
  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (
      extensionAction.parameters.feeAddress &&
      !Erc20ProxyPaymentNetwork.isValidAddress(extensionAction.parameters.feeAddress)
    ) {
      throw Error('feeAddress is not a valid address');
    }
    if (
      extensionAction.parameters.feeAmount &&
      !Utils.amount.isValid(extensionAction.parameters.feeAmount)
    ) {
      throw Error('feeAmount is not a valid amount');
    }

    const proxyPNCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...proxyPNCreationAction,
      events: [
        {
          name: 'create',
          parameters: {
            feeAddress: extensionAction.parameters.feeAddress,
            feeAmount: extensionAction.parameters.feeAmount,
            paymentAddress: extensionAction.parameters.paymentAddress,
            refundAddress: extensionAction.parameters.refundAddress,
            salt: extensionAction.parameters.salt,
          },
          timestamp,
        },
      ],
      values: {
        ...proxyPNCreationAction.values,
        feeAddress: extensionAction.parameters.feeAddress,
        feeAmount: extensionAction.parameters.feeAmount,
      },
    };
  }

  /**
   * Applies an add fee address and amount extension action
   *
   * @param extensionState previous state of the extension
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   * @param timestamp action timestamp
   *
   * @returns state of the extension updated
   */
  protected applyAddFee(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (
      extensionAction.parameters.feeAddress &&
      !Erc20ProxyPaymentNetwork.isValidAddress(extensionAction.parameters.feeAddress)
    ) {
      throw Error('feeAddress is not a valid address');
    }
    if (extensionState.values.feeAddress) {
      throw Error(`Fee address already given`);
    }
    if (
      extensionAction.parameters.feeAmount &&
      !Utils.amount.isValid(extensionAction.parameters.feeAmount)
    ) {
      throw Error('feeAmount is not a valid amount');
    }
    if (extensionState.values.feeAmount) {
      throw Error(`Fee amount already given`);
    }
    if (!requestState.payee) {
      throw Error(`The request must have a payee`);
    }
    if (!Utils.identity.areEqual(actionSigner, requestState.payee)) {
      throw Error(`The signer must be the payee`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // update fee address and amount
    copiedExtensionState.values.feeAddress = extensionAction.parameters.feeAddress;
    copiedExtensionState.values.feeAmount = extensionAction.parameters.feeAmount;

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnFeeReferenceBased.ACTION.ADD_FEE,
      parameters: {
        feeAddress: extensionAction.parameters.feeAddress,
        feeAmount: extensionAction.parameters.feeAmount,
      },
      timestamp,
    });

    return copiedExtensionState;
  }

  protected validateSupportedCurrency(
    request: RequestLogicTypes.IRequest,
    extensionAction: ExtensionTypes.IAction,
  ): void {
    if (
      request.currency.type !== RequestLogicTypes.CURRENCY.ERC20 ||
      (request.currency.network &&
        extensionAction.parameters.network === request.currency.network &&
        !supportedNetworks.includes(request.currency.network))
    ) {
      throw Error(
        `This extension can be used only on ERC20 requests and on supported networks ${supportedNetworks.join(
          ', ',
        )}`,
      );
    }
  }
}

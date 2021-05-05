import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import AbstractExtension from '../abstract-extension';
import Utils from '@requestnetwork/utils';

const CURRENT_VERSION = '0.1.0';

/**
 * Core of the address based payment networks
 * This module is called by the address based payment networks to avoid code redundancy
 */
export default abstract class AddressBasedPaymentNetwork extends AbstractExtension {
  public constructor(public extensionId: ExtensionTypes.ID, public currentVersion: string) {
    super(ExtensionTypes.TYPE.PAYMENT_NETWORK, extensionId, currentVersion);
    this.actions = {
      ...this.actions,
      [ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS]: this.applyAddPaymentAddress.bind(
        this,
      ),
      [ExtensionTypes.PnAddressBased.ACTION.ADD_REFUND_ADDRESS]: this.applyAddRefundAddress.bind(
        this,
      ),
    };
  }

  /**
   * Creates the extensionsData for address based payment networks
   *
   * @param extensions extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: ExtensionTypes.PnAddressBased.ICreationParameters,
  ): ExtensionTypes.IAction {
    if (
      creationParameters.paymentAddress &&
      !this.isValidAddress(creationParameters.paymentAddress)
    ) {
      throw Error('paymentAddress is not a valid address');
    }

    if (
      creationParameters.refundAddress &&
      !this.isValidAddress(creationParameters.refundAddress)
    ) {
      throw Error('refundAddress is not a valid address');
    }

    return {
      action: ExtensionTypes.PnAddressBased.ACTION.CREATE,
      id: this.extensionId,
      parameters: {
        paymentAddress: creationParameters.paymentAddress,
        refundAddress: creationParameters.refundAddress,
      },
      version: CURRENT_VERSION,
    };
  }

  /**
   * Creates the extensionsData to add a payment address
   *
   * @param extensions extensions parameters to create
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createAddPaymentAddressAction(
    addPaymentAddressParameters: ExtensionTypes.PnAddressBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    if (
      addPaymentAddressParameters.paymentAddress &&
      !this.isValidAddress(addPaymentAddressParameters.paymentAddress)
    ) {
      throw Error('paymentAddress is not a valid address');
    }

    return {
      action: ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
      id: this.extensionId,
      parameters: {
        paymentAddress: addPaymentAddressParameters.paymentAddress,
      },
    };
  }

  /**
   * Creates the extensionsData to add a refund address
   *
   * @param extensions extensions parameters to create
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createAddRefundAddressAction(
    addRefundAddressParameters: ExtensionTypes.PnAddressBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    if (
      addRefundAddressParameters.refundAddress &&
      !this.isValidAddress(addRefundAddressParameters.refundAddress)
    ) {
      throw Error('refundAddress is not a valid address');
    }

    return {
      action: ExtensionTypes.PnAddressBased.ACTION.ADD_REFUND_ADDRESS,
      id: this.extensionId,
      parameters: {
        refundAddress: addRefundAddressParameters.refundAddress,
      },
    };
  }

  /**
   * Applies a creation
   *
   * @param isValidAddress address validator function
   * @param extensionAction action to apply
   *
   * @returns state of the extension created
   */
  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (
      extensionAction.parameters.paymentAddress &&
      !this.isValidAddress(extensionAction.parameters.paymentAddress)
    ) {
      throw Error('paymentAddress is not a valid address');
    }
    if (
      extensionAction.parameters.refundAddress &&
      !this.isValidAddress(extensionAction.parameters.refundAddress)
    ) {
      throw Error('refundAddress is not a valid address');
    }

    const genericCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...genericCreationAction,
      events: [
        {
          name: 'create',
          parameters: {
            paymentAddress: extensionAction.parameters.paymentAddress,
            refundAddress: extensionAction.parameters.refundAddress,
          },
          timestamp,
        },
      ],
      id: this.extensionId,
      type: this.extensionType,
      values: {
        ...genericCreationAction.values,
        paymentAddress: extensionAction.parameters.paymentAddress,
        refundAddress: extensionAction.parameters.refundAddress,
      },
      version: CURRENT_VERSION,
    };
  }

  protected abstract isValidAddress(_address: string): boolean;

  /**
   * Applies add payment address
   *
   * @param extensionState previous state of the extension
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   *
   * @returns state of the extension updated
   */
  protected applyAddPaymentAddress(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (
      extensionAction.parameters.paymentAddress &&
      !this.isValidAddress(extensionAction.parameters.paymentAddress)
    ) {
      throw Error('paymentAddress is not a valid address');
    }
    if (extensionState.values.paymentAddress) {
      throw Error(`Payment address already given`);
    }
    if (!requestState.payee) {
      throw Error(`The request must have a payee`);
    }
    if (!Utils.identity.areEqual(actionSigner, requestState.payee)) {
      throw Error(`The signer must be the payee`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // update payment address
    copiedExtensionState.values.paymentAddress = extensionAction.parameters.paymentAddress;
    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnAddressBased.ACTION.ADD_PAYMENT_ADDRESS,
      parameters: { paymentAddress: extensionAction.parameters.paymentAddress },
      timestamp,
    });

    return copiedExtensionState;
  }

  /**
   * Applies add refund address
   *
   * @param extensionState previous state of the extension
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   *
   * @returns state of the extension updated
   */
  protected applyAddRefundAddress(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (
      extensionAction.parameters.refundAddress &&
      !this.isValidAddress(extensionAction.parameters.refundAddress)
    ) {
      throw Error('refundAddress is not a valid address');
    }
    if (extensionState.values.refundAddress) {
      throw Error(`Refund address already given`);
    }
    if (!requestState.payer) {
      throw Error(`The request must have a payer`);
    }
    if (!Utils.identity.areEqual(actionSigner, requestState.payer)) {
      throw Error(`The signer must be the payer`);
    }

    const copiedExtensionState: ExtensionTypes.IState = Utils.deepCopy(extensionState);

    // update refund address
    copiedExtensionState.values.refundAddress = extensionAction.parameters.refundAddress;
    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnAddressBased.ACTION.ADD_REFUND_ADDRESS,
      parameters: { refundAddress: extensionAction.parameters.refundAddress },
      timestamp,
    });

    return copiedExtensionState;
  }
}

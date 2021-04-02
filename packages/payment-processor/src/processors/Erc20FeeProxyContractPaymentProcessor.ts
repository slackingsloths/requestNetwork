import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes } from '@requestnetwork/types';
import { ethers, providers, Signer } from 'ethers';
import { ERC20FeeProxy__factory } from 'smart-contracts/types';
import { FeePaymentProcessorBase, FeePaymentProcessorBaseOptions } from './PaymentProcessorBase';

export class Erc20FeeProxyContractPaymentProcessor extends FeePaymentProcessorBase {
  constructor(
    request: ClientTypes.IRequestData,
    options: FeePaymentProcessorBaseOptions,
    signerOrProvider?: providers.Web3Provider | Signer,
  ) {
    super(request, options, signerOrProvider);
  }

  get data(): string {
    const tokenAddress = this.request.currencyInfo.value;
    const { paymentReference, paymentAddress, feeAddress } = this.paymentValues;

    const proxyContract = ERC20FeeProxy__factory.connect(this.to, this.signer);

    return proxyContract.interface.encodeFunctionData('transferFromWithReferenceAndFee', [
      tokenAddress,
      paymentAddress,
      this.amountToPay,
      `0x${paymentReference}`,
      this.feeToPay,
      feeAddress || ethers.constants.AddressZero,
    ]);
  }

  get to(): string {
    return erc20FeeProxyArtifact.getAddress(this.request.currencyInfo.network || 'mainnet');
  }
}

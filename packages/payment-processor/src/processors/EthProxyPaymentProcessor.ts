import { ClientTypes } from '@requestnetwork/types';
import { BigNumber, providers, Signer } from 'ethers';
import { BasePaymentOptions, PaymentProcessorBase } from './PaymentProcessorBase';
import { ethereumProxyArtifact } from '@requestnetwork/smart-contracts';
import { EthereumProxy__factory } from '@requestnetwork/smart-contracts/types';

export class EthProxyPaymentProcessor extends PaymentProcessorBase {
  constructor(
    request: ClientTypes.IRequestData,
    options: BasePaymentOptions,
    signerOrProvider?: providers.Web3Provider | Signer,
  ) {
    super(request, options, signerOrProvider);
  }

  get value(): BigNumber {
    return this.amountToPay;
  }

  get data(): string {
    const proxyContract = EthereumProxy__factory.connect(this.to, this.signer);
    const { paymentAddress, paymentReference } = this.paymentValues;
    return proxyContract.interface.encodeFunctionData('transferWithReference', [
      paymentAddress,
      `0x${paymentReference}`,
    ]);
  }

  get to(): string {
    return ethereumProxyArtifact.getAddress(this.request.currencyInfo.network || 'mainnet');
  }
}

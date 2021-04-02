import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { ClientTypes } from '@requestnetwork/types';
import { providers, Signer } from 'ethers';
import { ERC20Proxy__factory } from 'smart-contracts/types';
import { PaymentProcessorBase, BasePaymentOptions } from './PaymentProcessorBase';

export class Erc20ProxyContractPaymentProcessor extends PaymentProcessorBase {
  constructor(
    request: ClientTypes.IRequestData,
    options: BasePaymentOptions,
    signerOrProvider?: providers.Web3Provider | Signer,
  ) {
    super(request, options, signerOrProvider);
  }

  get data(): string {
    const tokenAddress = this.request.currencyInfo.value;
    const { paymentAddress, paymentReference } = this.paymentValues;
    const proxyContract = ERC20Proxy__factory.connect(this.to, this.signer);
    return proxyContract.interface.encodeFunctionData('transferFromWithReference', [
      tokenAddress,
      paymentAddress,
      this.amountToPay,
      `0x${paymentReference}`,
    ]);
  }

  get to(): string {
    return erc20ProxyArtifact.getAddress(this.request.currencyInfo.network || 'mainnet');
  }
}

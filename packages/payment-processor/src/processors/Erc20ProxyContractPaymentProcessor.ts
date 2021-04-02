import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { ERC20Proxy, ERC20Proxy__factory } from '@requestnetwork/smart-contracts/types';
import { ClientTypes } from '@requestnetwork/types';
import { providers, Signer } from 'ethers';
import { PaymentProcessorBase, BasePaymentOptions } from './PaymentProcessorBase';

export class Erc20ProxyContractPaymentProcessor extends PaymentProcessorBase {
  protected proxyContract: ERC20Proxy;
  constructor(
    request: ClientTypes.IRequestData,
    options: BasePaymentOptions,
    signerOrProvider?: providers.Web3Provider | Signer,
  ) {
    super(request, options, signerOrProvider);
    this.proxyContract = ERC20Proxy__factory.connect(this.to, this.signer);
  }

  get data(): string {
    const tokenAddress = this.request.currencyInfo.value;
    const { paymentAddress, paymentReference } = this.paymentValues;
    return this.proxyContract.interface.encodeFunctionData('transferFromWithReference', [
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

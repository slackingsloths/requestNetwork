import { ClientTypes } from '@requestnetwork/types';
import { ethers, providers, Signer } from 'ethers';
import { ITransactionOverrides } from './payment/transaction-overrides';
import { processorFactory, PaymentSettings } from './processors';

export const payRequest = (
  request: ClientTypes.IRequestData,
  paymentSettings?: PaymentSettings,
  signerOrProvider?: providers.Web3Provider | Signer,
  overrides?: ITransactionOverrides,
): Promise<ethers.providers.TransactionResponse> => {
  const processor = processorFactory(request, signerOrProvider, paymentSettings);
  return processor.signer.sendTransaction({
    ...processor.transactionParameters,
    ...overrides,
  });
};

export const prepareRequestPayment = (
  request: ClientTypes.IRequestData,
  paymentSettings?: PaymentSettings,
): Pick<providers.TransactionRequest, 'data' | 'to' | 'value'> => {
  const processor = processorFactory(request, undefined, paymentSettings);
  return processor.transactionParameters;
};

export const encodeRequestPayment = (
  request: ClientTypes.IRequestData,
  paymentSettings?: PaymentSettings,
): string => {
  const processor = processorFactory(request, undefined, paymentSettings);
  return processor.data;
};

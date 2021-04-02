import {
  ethereumProxyArtifact,
  erc20FeeProxyArtifact,
  erc20ProxyArtifact,
  erc20ConversionProxy,
} from '@requestnetwork/smart-contracts';
import { ExtensionTypes } from '@requestnetwork/types';

type Artifact = {
  getAddress(networkName: string): string;
};

export const artifacts: Partial<Record<ExtensionTypes.ID, Artifact>> = {
  [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: erc20ProxyArtifact,
  [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_FEE_PROXY_CONTRACT]: erc20FeeProxyArtifact,
  [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE]: erc20ConversionProxy,
  [ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA]: ethereumProxyArtifact,
};

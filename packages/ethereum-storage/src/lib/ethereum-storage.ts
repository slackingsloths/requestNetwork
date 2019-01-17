import { Storage as StorageTypes } from '@requestnetwork/types';
import IpfsManager from './ipfs-manager';
import SmartContractManager from './smart-contract-manager';

/**
 * EthereumStorage
 * @notice Manages storage layer of the Request Network Protocol v2
 */
export default class EthereumStorage implements StorageTypes.IStorage {
  /**
   * Manager for the storage smart contract
   * This attribute is left public for mocking purpose to facilitate tests on the module
   */
  public smartContractManager: SmartContractManager;
  /**
   * Manager for IPFS
   * This attribute is left public for mocking purpose to facilitate tests on the module
   */
  public ipfsManager: IpfsManager;

  /**
   * Constructor
   * @param ipfsGatewayConnection Information structure to connect to the ipfs gateway
   * @param web3Connection Information structure to connect to the Ethereum network
   */
  public constructor(
    ipfsGatewayConnection?: StorageTypes.IIpfsGatewayConnection,
    web3Connection?: StorageTypes.IWeb3Connection,
  ) {
    this.ipfsManager = new IpfsManager(ipfsGatewayConnection);
    this.smartContractManager = new SmartContractManager(web3Connection);
  }

  /**
   * Update gateway connection information and connect to the new gateway
   * Missing value are filled with default config value
   * @param ipfsConnection Information structure to connect to the ipfs gateway
   */
  public updateIpfsGateway(ipfsGatewayConnection: StorageTypes.IIpfsGatewayConnection): void {
    this.ipfsManager = new IpfsManager(ipfsGatewayConnection);
  }

  /**
   * Update Ethereum network connection information and reconnect
   * Missing value are filled with default config value
   * @param web3Connection Information structure to connect to the Ethereum network
   */
  public updateEthereumNetwork(web3Connection: StorageTypes.IWeb3Connection): void {
    this.smartContractManager = new SmartContractManager(web3Connection);
  }

  /**
   * Append content into the storage: add the content to ipfs and the hash on Ethereum
   * @param content Content to add into the storage
   * @returns Promise resolving id used to retrieve the content
   */
  public async append(content: string): Promise<StorageTypes.IRequestStorageOneDataIdAndMeta> {
    if (!content) {
      throw Error('No content provided');
    }

    // Add content to ipfs
    let dataId;
    try {
      dataId = await this.ipfsManager.add(content);
    } catch (error) {
      throw Error(`Ipfs add request error: ${error}`);
    }

    // Get content length from ipfs
    let contentLength;
    try {
      contentLength = await this.ipfsManager.getContentLength(dataId);
    } catch (error) {
      throw Error(`Ipfs get length request error: ${error}`);
    }

    // Add content hash to ethereum
    let ethereumMetadata;
    try {
      ethereumMetadata = await this.smartContractManager.addHashAndSizeToEthereum(
        dataId,
        contentLength,
      );
    } catch (error) {
      throw Error(`Smart contract error: ${error}`);
    }

    return {
      meta: {
        ethereum: ethereumMetadata,
        ipfs: { size: contentLength },
        storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      },
      result: { dataId },
    };
  }

  /**
   * Read content from the storage
   * @param Id Id used to retrieve content
   * @returns Promise resolving content from id
   */
  public async read(id: string): Promise<StorageTypes.IRequestStorageOneContentAndMeta> {
    if (!id) {
      throw Error('No id provided');
    }

    // get meta data from ethereum
    let ethereumMetadata;
    try {
      ethereumMetadata = await this.smartContractManager.getMetaFromEthereum(id);
    } catch (error) {
      throw Error(`Ethereum meta read request error: ${error}`);
    }

    // Send ipfs request
    let content;
    try {
      content = await this.ipfsManager.read(id);
    } catch (error) {
      throw Error(`Ipfs read request error: ${error}`);
    }

    // Get content length from ipfs
    let contentLength;
    try {
      contentLength = await this.ipfsManager.getContentLength(id);
    } catch (error) {
      throw Error(`Ipfs get length request error: ${error}`);
    }

    return {
      meta: {
        ethereum: ethereumMetadata,
        ipfs: { size: contentLength },
        storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
      },
      result: { content },
    };
  }

  /**
   * Get all data stored on the storage
   * @returns Promise resolving stored data
   */
  public async getAllData(): Promise<StorageTypes.IRequestStorageGetAllDataReturn> {
    const allDataIds = await this.getAllDataId();

    const dataPromises = allDataIds.result.dataIds.map(
      async (id: string): Promise<StorageTypes.IRequestStorageOneContentAndMeta> => {
        // Return empty string if id has not been retrieved
        // TODO PROT-197 Should be removed after
        if (!id) {
          return { meta: {}, result: { content: '' } };
        }

        return this.read(id);
      },
    );

    const allContentsAndMeta = await Promise.all(dataPromises);
    const metaData = allContentsAndMeta.map(obj => obj.meta);
    const data = allContentsAndMeta.map(obj => obj.result.content);

    return {
      meta: {
        metaData,
      },
      result: { data },
    };
  }

  /**
   * Get all id from data stored on the storage
   * @returns Promise resolving id of stored data
   */
  public async getAllDataId(): Promise<StorageTypes.IRequestStorageGetAllDataIdReturn> {
    const hashAndSizePromises = await this.smartContractManager.getAllHashesAndSizesFromEthereum();

    // Filter hashes where size doesn't correspond to the size stored on ipfs
    const filteredHashes = hashAndSizePromises.map(
      async (
        hashAndSizePromise: StorageTypes.IRequestStorageGetAllHashesAndSizes,
      ): Promise<StorageTypes.IRequestStorageOneDataIdAndMeta> => {
        const hashAndSize = await hashAndSizePromise;

        if (!hashAndSize.hash || !hashAndSize.size) {
          // The event log is incorrect
          // TODO PROT-197
          // throw Error('The event log has no hash or size');
          return {
            meta: {},
            result: {
              dataId: '',
            },
          };
        }

        // Get content from ipfs and verify provided size is correct
        let hashContentSize;
        try {
          hashContentSize = await this.ipfsManager.getContentLength(hashAndSize.hash);
        } catch (error) {
          // TODO PROT-197
          // throw Error(`IPFS getContentLength: ${error}`);
          return {
            meta: {},
            result: {
              dataId: '',
            },
          };
        }
        if (hashContentSize !== hashAndSize.size) {
          // TODO PROT-197
          // throw Error(
          //   'The size of the content is not the size stored on ethereum',
          // );
          return {
            meta: {},
            result: {
              dataId: '',
            },
          };
        }

        // get meta data from ethereum
        let ethereumMetadata;
        try {
          ethereumMetadata = await this.smartContractManager.getMetaFromEthereum(hashAndSize.hash);
        } catch (error) {
          throw Error(`Ethereum meta read request error: ${error}`);
        }

        return {
          meta: {
            ethereum: ethereumMetadata,
            ipfs: { size: hashContentSize },
            storageType: StorageTypes.StorageSystemType.ETHEREUM_IPFS,
          },
          result: {
            dataId: hashAndSize.hash,
          },
        };
      },
    );
    const arrayOfDataIdAndMeta = await Promise.all(filteredHashes);

    // create the array of data ids
    const dataIds = arrayOfDataIdAndMeta.map(dataIdAndMeta => {
      // TODO PROT-197
      // if no dataId, put an empty string to keep the match between dataIds and metaDataIds arrays
      return dataIdAndMeta.result.dataId || '';
    });
    // create the array of metadata
    const metaDataIds = arrayOfDataIdAndMeta.map(dataIdAndMeta => {
      // TODO PROT-197
      // if no meta, put an empty object to keep the match between dataIds and metaDataIds arrays
      return dataIdAndMeta.meta || {};
    });

    return {
      meta: {
        metaDataIds,
      },
      result: { dataIds },
    };
  }
}
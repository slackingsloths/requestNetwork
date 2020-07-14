# Dynamic Payment Network - ERC20 - proxy contract

## Description

Similarly to `pn-erc20-address-based` payment networks, this extension allows the payments and the refunds to be made in 
ERC20 tokens on the Ethereum blockchain. The ERC20 amount is computed at the payment stage, based on the expected amount,
fixed in the request currency.
Upon request creation, a list of acceptable ERC20 tokens is defined.
Upon request payment, the conversion rate between the request amount and one of the ERC20 tokens fixes the amount to be
paid. 
If the payment is made in several transfers, they should all be made with the same currency.

As a payment network, this extension allows to compute a payment `balance` for the request. (see
[Interpretation](#Interpretation))

## Contract

The dynamic payment network uses the same contract as its non-dynamic counter-part:
* [cf. `pn-erc20-proxy-contract`#Contract](./payment-network-erc20-proxy-contract-0.1.0.md#Contract)
* [cf. smart contract](../../smart-contracts/src/contracts/ERC20Proxy.sol)

## Properties

| Property                  | Type   | Description                                    | Requirement   |
| ------------------------- | ------ | ---------------------------------------------- | ------------- |
| **id**                    | String | constant value: "dpn-erc20-proxy-contract"     | **Mandatory** |
| **type**                  | String | constant value: "dynamicPaymentNetwork"        | **Mandatory** |
| **version**               | String | constant value: "0.1.0"                        | **Mandatory** |
| **events**                | Array  | List of the actions performed by the extension | **Mandatory** |
| **values**                | Object |                                                |               |
| **values.salt**           | String | Salt for the request                           | **Mandatory**      |
| **values.paymentAddress** | String | Ethereum address for the payment               | Optional      |
| **values.refundAddress**  | String | Ethereum address for the refund                | Optional      |
| **values.oracle**           | String | TODO: ID OR URL?                   | **Mandatory** |
| **values.tokenAddresses** | Array | List of valid payment token addresses                  | **Mandatory**      |

---

## Interpretation

The current version relies on https://www.cryptocompare.com/ as a price oracle to compute the request's payment status.

[Cf. `pn-erc20-proxy-contract`#Contract](./payment-network-erc20-proxy-contract-0.1.0.md#Interpretation) for the details of how
payments can be

The proxy contract address is determined by the `request.currency.network` (see (table)[#Contract] with proxy contract addresses).

Any `TransferWithReference` events emitted from the proxy contract with the following arguments are considered as a payment:
- `tokenAddress` `===` `request.currency.value`
- `to` `===` `paymentAddress`
- `paymentReference` `===` `last8Bytes(hash(lowercase(requestId + salt + payment address)))`

Any `TransferWithReference` events emitted from the proxy contract with the following arguments are considered as a refund:
- `tokenAddress` `===` `request.currency.value`
- `to` `===` `refundAddress`
- `paymentReference` `===` `last8Bytes(hash(lowercase(requestId + salt + refund address)))`

The sum of payment amounts minus the sum of refund amounts is considered the balance.

---

## Actions

### Creation

#### Parameters

|                               | Type   | Description                               | Requirement   |
| ----------------------------- | ------ | --------------------------------          | ------------- |
| **id**                        | String | Constant value: "pn-erc20-proxy-contract" | **Mandatory** |
| **type**                      | String | Constant value: "paymentNetwork"          | **Mandatory** |
| **version**                   | String | Constant value: "0.1.0"                   | **Mandatory** |
| **parameters**                | Object |                                           |               |
| **parameters.salt**           | String | Salt for the request                      | **Mandatory** |
| **parameters.oracle**           | String | TODO: ID OR URL?                   | **Mandatory** |
| **parameters.paymentAddress** | String | Ethereum address for the payment          | Optional      |
| **parameters.refundAddress**  | String | Ethereum address for the refund           | Optional      |


#### Conditions

This action is valid if:

- The `salt` is not empty and long enough (8 bytes of randomness minimum).
- The `currency.type` is ERC20.
- The oracle is implemented, for the version 0.1.0, this means it has to equal "TODO ID or URL?"

#### Warnings

[cf. `pn-erc20-proxy-contract`#Warnings](./payment-network-erc20-proxy-contract-0.1.0.md#Warnings)

#### Results

An extension state is created with the following properties:

|  Property                 |  Value                                                         |
| ------------------------- | -------------------------------------------------------------- |
| **id**                    | "dpn-erc20-proxy-contract"                                      |
| **type**                  | "paymentNetwork"                                               |
| **version**               | "0.1.0"                                                        |
| **values**                |                                                                |
| **values.paymentAddress** | `paymentAddress` from parameters if given, undefined otherwise |
| **values.refundAddress**  | `refundAddress` from parameters if given, undefined otherwise  |
| **values.oracle**           | String | TODO: ID OR URL?                   |
| **values.salt**           | Salt for the request                                           |
| **events**                | Array with one 'create' event (see below)                      |

the 'create' event:

|  Property                     |  Value                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| **name**                      | 'create'                                                       |
| **parameters**                |                                                                |
| **parameters.paymentAddress** | `paymentAddress` from parameters if given, undefined otherwise |
| **parameters.refundAddress**  | `refundAddress` from parameters if given, undefined otherwise  |
| **parameters.salt**           | Salt for the request                                           |

---

### Updates

#### addPaymentAddress

##### Parameters

|                               | Type   | Description                               | Requirement   |
| ----------------------------- | ------ | -----------------------------------       | ------------- |
| **id**                        | String | Constant value: "pn-erc20-proxy-contract" | **Mandatory** |
| **action**                    | String | Constant value: "addPaymentAddress"       | **Mandatory** |
| **parameters**                | Object |                                           |               |
| **parameters.paymentAddress** | String | Ethereum address for the payment          | **Mandatory** |

##### Conditions

This action is valid, if:

- The extension state with the id "pn-erc20-proxy-contract" exists
- The signer is the `payee`
- The extension property `paymentAddress` is undefined

##### Warnings

None.

##### Results

An extension state is updated with the following properties:

|  Property                  |  Value                                               |
| -------------------------- | ---------------------------------------------------- |
| **values.paymentAddress**  | `paymentAddress` from parameters                     |
| **events**                 | Add an 'paymentAddress' event (see below) at its end |

the 'addPaymentAddress' event:

|  Property                     |  Value                              |
| ----------------------------- | ----------------------------------- |
| **name**                      | Constant value: "addPaymentAddress" |
| **parameters**                |                                     |
| **parameters.paymentAddress** | `paymentAddress` from parameters    |

#### addRefundAddress

##### Parameters

|                              | Type   | Description                               | Requirement   |
| ---------------------------- | ------ | ----------------------------------        | ------------- |
| **id**                       | String | Constant value: "pn-erc20-proxy-contract" | **Mandatory** |
| **action**                   | String | Constant value: "addRefundAddress"        | **Mandatory** |
| **parameters**               | Object |                                           |               |
| **parameters.refundAddress** | String | Ethereum address for the refund           | **Mandatory** |

##### Conditions

This action is valid if:

- The extension state with the id "pn-erc20-proxy-contract" exists
- The signer is the `payer`
- The extension property `refundAddress` is undefined

##### Warnings

None.

##### Results

An extension state is updated with the following properties:

|  Property                |  Value                                                 |
| ------------------------ | ------------------------------------------------------ |
| **values.refundAddress** | `refundAddress` from parameters                        |
| **events**               | Add an 'addRefundAddress' event (see below) at its end |

The 'addRefundAddress' event:

|  Property                    |  Value                          |
| ---------------------------- | ------------------------------- |
| **name**                     | 'addRefundAddress'              |
| **parameters**               |                                 |
| **parameters.refundAddress** | `refundAddress` from parameters |


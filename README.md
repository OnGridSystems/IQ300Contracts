[![Build Status](https://travis-ci.org/OnGridSystems/IQ300Contracts.svg?branch=master)](https://travis-ci.org/OnGridSystems/IQ300Contracts)
# IQ-300 Token and Crowdsale (ICO) contracts
IQ-300 Ethereum contracts stack consists of
* Tempus token (TPS) - the coin supposed to be the main digital asset in IQ-300 Business Processes Management application;
* Crowdsale contract - preallocates TPSes to investors during ICO token sale

## Token contract
TPS is [ERC-20](https://github.com/ethereum/EIPs/issues/20) standard token with the following paramaters:

- Name: **Tempus**
- Symbol: **TPS**
- Decimals: **8**
- Mintable: **Yes**, Special role for minting
- Capped: **Yes**, Cap = **1,000,000,000**.00000000 TPS (1 billion tokens)
- Burnable: **Yes**, owner can burn his tokens 
- RBAC: **Yes**, Minters (can mint), Owners (can add minters)
- Source Code: **[IQ300Token.sol](contracts/IQ300Token.sol)**
- Mainnet address: **[0x900B2a673b71E77DB2c9AE91A5934d0475b26F11](https://etherscan.io/address/0x900b2a673b71e77db2c9ae91a5934d0475b26f11)**

## Crowdsale contract

- Source code: **[IQ300Crowdsale.sol](contracts/IQ300Crowdsale.sol)**
- Mainnet address: **[0x72C07C362381add16De08a9359110aC2595221E2](https://etherscan.io/address/0x72c07c362381add16de08a9359110ac2595221e2)**
- Minimal allowed investment: **0.1 ETH**
- Cap: **1,000,000,000**.00000000 TPS (1 billion tokens)
- Rounds: 5 (4 phases are time-limited and capped, last phase is not time-limited but have global crowdsale capped)

Contract for IQ-300 project token crowdsale receives ether and sends back corresponding amount of TPS tokens to the investor.
The crowdsale comprises 5 rounds with different prices ETH/TPS starting from 0,005 ETH for 1.00000000 TPS on start. 
- **Round0** starts at the moment of contract deployment with the price 0,005 ETH for 1.00000000 TPS and finishes after phase cap reached or after 30 days from the start date whichever occurs first.
- **Round1-3** start after the previous round finished with increased price and finish after phase cap reached or after 30 days from the start date of the round (whichever occurs first).
- **Round 4** the last round, starts after the round 3 but has no time limit and no phase cap (global crowdsale cap 1B TPS still applies).


### Crowdsale phases

| Round |       Start date       |     End date (UTC)      |     Phase cap, TPS    | Price ETH per TPS |
| ----- | ---------------------- | ----------------------- | --------------------- | ----------------- |
| 0     | contract creation time |      creation + 30days  |  20% of 1B = 200M TPS |             0.005 |
| 1     |  just after Round0 end |  round1 start + 30days  |     20% of unsold TPS |             0.01  |
| 2     |  just after Round1 end |  round2 start + 30days  |     20% of unsold TPS |             0.02  |
| 3     |  just after Round2 end |  round3 start + 30days  |     20% of unsold TPS |             0.04  |
| 4     |  just after Round3 end |       not time-limited  |  global cap in effect |             0.08  |

There is no option to change phases parameters after contract deployed. The contract can be stopped (deactivated temporarily or permanently) by revocation of its minting privileges on the token.

## Wallets

All the funds received from the investors are evenly split and forwarded to securely stored wallets (Externally Owned Accounts) 
to avoid any on-chain risks. Wallets can be added or removed at any point of time by the owners. 
```
Crowdsale.getWalletsCount()
Crowdsale.wallets(0)
Crowdsale.addWallet(walletAddress)
Crowdsale.wallets(1)
Crowdsale.delWallet(0)
```

## Getting started
### Get the source code
Clone the contracts repository with submodules (we use zeppelin-solidity libraries)
```
git clone --recurse-submodules git@github.com:OnGridSystems/IQ300Contracts.git
```

### Run tests
- Run ```npm install```.
- Run ```./scripts/test.sh```.

### Deploy on the net

- Flatten your solidity code
The simplest way to transfer your code to the IDE and other tools is to make it flat (opposed to hierarchically organized tree)
Install truffle-flattener via npm
```npm install -g truffle-flattener```
flatten your contract to a single code snippet, copy it
```truffle-flattener contracts/IQ300Crowdsale.sol```
You can use [Remix IDE](http://remix.ethereum.org) for deployment on the net. 

- Deploy **Token** contract, you should get an address of deployed contract (*Token*)
```
deploy(Token)
```
- As Tx get mined go to the etherscan and do **Token**'s source code verification
- Deploy **Crowdsale** contract, using the **Token** address as argument

```
deploy(Crowdsale, Token.address)
```
- Add receiving wallets manually.
```
Crowdsale.addWallet(walletAddress1)
Crowdsale.addWallet(walletAddress2)
```
- Add Crowdsale contract to the minters list of the token
```
Token.addMinter(Crowdsale.address)
```
### Post-Deploy steps
- Good practice is to verify Source Code on the etherscan. Do it for both Crowdsale and Token.
- Publish your Crowdsale contract for investors. Make a notice on dates, discounts and minimal contributon.

## Authors
* OnGrid Systems: [Site](https://ongrid.pro), [GitHub](https://github.com/OnGridSystems/), [FaceBook](https://www.facebook.com/ongrid.pro/), [Youtube](https://www.youtube.com/channel/UCT8s-f1FInO6ivn_dp-W34g), [LinkedIn](https://www.linkedin.com/company/ongridpro/)
# Omuzeo

Omuzeo is an NFT web platform where content creators can connect and sell directly to global fans and earn royalties each time their work is sold or accessed via paywall.

<img src="https://github.com/FYYKX/omuzeo/blob/master/home-marketplace.png" alt="omuzeo homepage" />

##  Overview

This project is submitted for the Mercury Hackathon 2021.

Omuzeo at its core is built on [Flow](https://onflow.org) blockchain. It utilises five smart contracts three of which are ready-to-use templates: `NonFungibleToken`, `NFTStorefront`, `FungibleToken`. We've used this to speed up the creation and listing of NFTs for sale, trading of FLOW cryptocurrency as well as to implement the sales cut for content creators. The fourth smart contract is [`OmuzeoItems`](https://github.com/FYYKX/omuzeo#omuzeoitems) for a typical scenario of selling only one version of the NFT that is not a locked content and earning royalties each time it is sold to a new owner. The last smart contract that we developed is [`OmuzeoNFT`](https://github.com/FYYKX/omuzeo#omuzeonft). This is to allow copies of content creator's paywalled content to be sold by other users of the platform thereby giving a percentage of sales to the content creator when the restricted content is accessed.


### Architecture

<img src="https://github.com/FYYKX/omuzeo/blob/master/architecture.png" alt="omuzeo web architecture" />

| Component | Description                                                                 |
| :---      | :---                                                                        |
| Flow      | The blockchain to store contracts, invoke scripts and make transactions.    |
| Blocto    | A Flow compatible wallet for user identity service.                         |
| IPFS      | A distributed storage system to store images and view them with gateway URL.|
| web       | The frontend component based on React.                                      |
| api       | The backend component to mint NFTs.                                         |

## NFT Contracts

### OmuzeoItems

The contract based on the `NonFungibleToken` to enable a user to view the metadata of the NFT.

### OmuzeoNFT

The contract that hides the content metadata from public. Only when someone buys an access to the child NFT can the content be viewed. The contract also provides a functionality to create "tickets" (a.k.a child NFTs) to the owner of the NFT. Each child NFT generated splits the sales earnings to both the owner and creator. As of this writing it's a 70-30 split.

## Getting Started Locally

### Web setup
```
# Get the latest snapshot
git clone https://github.com/FYYKX/omuzeo.git

# Change directory
cd omuzeo

# Install yarn dependencies
yarn install

# Then simply start your app
yarn run start

```

### Account setup
- [ ] Sign up for an account in Blocto
- [ ] Add Testnet FLOW tokens to your account at [Flow faucet](https://testnet-faucet.onflow.org/)
- [ ] Log in to Omuzeo at [`http://localhost:3000`](http://localhost:3000)

## Project Structure

| Name    | Description                 |
| ------- | --------------------------- |
| api     | backend API to mint the NFT |
| cadence | Flow smart contracts        |
| src     | web ReactJS                 |

# Credits
- The project baseline code is taken from [Flowwow](https://github.com/jochasinga/flowwow/tree/master/src) and [KittyItems](https://github.com/onflow/kitty-items)

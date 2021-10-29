# Omuzeo

Omuzeo is an NFT art marketplace built on [Flow](https://onflow.org) and [NFT Storage](https://nft.storage). It manage NFTs on the Flow blockchain, storing them in IPFS and Filecoin via the NFT.storage service.

## NFT Contracts

### OmuzeoItems

Standard NFT contract base on the NonFungibleToken, user can view the metadata of the NFT

### OmuzeoNFT

Omuzeo NFT contract hide the content metadata from public, only when user buy the nft, can view the content, provide `createTickets` function to the owner the NFT, can generate ticket NFT base on current NFT then sell to public, when customer buy the ticket NFT, both owner and create get paid. owner 70% and create 30%

## Project Structure

| Name    | Description                 |
| ------- | --------------------------- |
| api     | backend api to mint the nft |
| cadence | nft contract                |
| src     | web reactjs                 |

## IFPS

Using IFPS to storage the image, then view the image with gateway url

## Flow

Using Flow to create the NFT contract, and `NFTStorefront` as the marketplace contract

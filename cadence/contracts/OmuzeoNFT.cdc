import NonFungibleToken from "./NonFungibleToken.cdc"
pub contract OmuzeoNFT: NonFungibleToken {

    // Events
    //
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Minted(id: UInt64)

    // Named Paths
    //
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath
    pub let AdminStoragePath: StoragePath

    // totalSupply
    // The total number of OmuzeoNFT that have been minted
    //
    pub var totalSupply: UInt64

    pub resource NFT: NonFungibleToken.INFT {
        pub let id: UInt64
        pub let metadata: String
        pub let creator: Address
        pub let type: String
        pub let tickets: [UInt64]

        init(id: UInt64, metadata: String, creator: Address, type: String) {
            self.id = id
            self.metadata = metadata
            self.creator = creator
            self.type = type
            self.tickets = []
        }
    }

    pub struct Item {
        pub let id: UInt64
        pub let creator: Address
        pub let type: String
        pub let tickets: [UInt64]

        init(id: UInt64, creator: Address, type: String, tickets: [UInt64]) {
            self.id = id
            self.creator = creator
            self.type = type
            self.tickets = tickets
        }
    }

    pub resource interface OmuzeoNFTCollectionPublic {
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
        pub fun borrowItem(id: UInt64): Item
    }

    pub resource Collection: OmuzeoNFTCollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {

        // dictionary of NFTs
        // NFT is a resource type with an `UInt64` ID field
        //
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        // withdraw
        // Removes an NFT from the collection and moves it to the caller
        //
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")

            emit Withdraw(id: token.id, from: self.owner?.address)

            return <- token
        }

        // deposit
        // Takes a NFT and adds it to the collections dictionary
        // and adds the ID to the id array
        //
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @OmuzeoNFT.NFT

            let id: UInt64 = token.id

            // add the new token to the dictionary which removes the old one
            let oldToken <- self.ownedNFTs[id] <- token

            emit Deposit(id: id, to: self.owner?.address)

            destroy oldToken
        }

        // getIDs
        // Returns an array of the IDs that are in the collection
        //
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        // borrowNFT
        // Gets a reference to an NFT in the collection
        // so that the caller can read its metadata and call its methods
        //
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }

        // borrowOmuzeoNFT
        // Gets a reference to an NFT in the collection as a OmuzeoNFT.
        //
        pub fun borrowOmuzeoNFT(id: UInt64): &OmuzeoNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
                return ref as! &OmuzeoNFT.NFT
            } else {
                return nil
            }
        }

        pub fun borrowItem(id: UInt64): Item {
            let nft = self.borrowOmuzeoNFT(id: id)
                ?? panic("can not get NFT")
            return Item(id: nft.id, creator: nft.creator, type: nft.type, tickets: nft.tickets)
        }

        pub fun createTickets(id: UInt64, total: UInt64) {
            let nft = self.borrowOmuzeoNFT(id: id)
                ?? panic("can not get NFT")
            var i: UInt64 = 0
            while i < total {
                let ticket <- create OmuzeoNFT.NFT(id: OmuzeoNFT.totalSupply, metadata: nft.metadata, creator: nft.creator, type: "owner")
                nft.tickets.append(OmuzeoNFT.totalSupply)
                OmuzeoNFT.totalSupply = OmuzeoNFT.totalSupply + (1 as UInt64)
                self.deposit(token: <- ticket)
                i = i + 1
            }
        }

        // destructor
        destroy() {
            destroy self.ownedNFTs
        }

        // initializer
        //
        init () {
            self.ownedNFTs <- {}
        }
    }

    // createEmptyCollection
    // public function that anyone can call to create a new empty collection
    //
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    // Admin
    // Resource that an admin can use to mint NFTs and manage drops.
    //
    pub resource Admin {

        // mintNFT
        // Mints a new NFT with a new ID
        // and deposit it in the recipients collection using their collection reference
        //
        pub fun mintNFT(recipient: &{NonFungibleToken.CollectionPublic}, metadata: String, creator: Address) {
            emit Minted(id: OmuzeoNFT.totalSupply)

            // deposit it in the recipient's account using their reference
            recipient.deposit(token: <- create OmuzeoNFT.NFT(id: OmuzeoNFT.totalSupply, metadata: metadata, creator: creator, type: "creator"))

            OmuzeoNFT.totalSupply = OmuzeoNFT.totalSupply + (1 as UInt64)
        }
    }

    // fetch
    // Get a reference to a OmuzeoNFT from an account's Collection, if available.
    // If an account does not have a OmuzeoNFT.Collection, panic.
    // If it has a collection but does not contain the itemID, return nil.
    // If it has a collection and that collection contains the itemID, return a reference to that.
    //
    pub fun fetch(_ from: Address, itemID: UInt64): Item {
        let collection = getAccount(from)
            .getCapability(OmuzeoNFT.CollectionPublicPath)
            .borrow<&{ OmuzeoNFT.OmuzeoNFTCollectionPublic }>()
            ?? panic("Couldn't get collection")

        // We trust OmuzeoNFT.Collection.borowNFT to get the correct itemID
        // (it checks it before returning it).
        return collection.borrowItem(id: itemID)
    }

    // initializer
    //
    init() {
        // Set our named paths
        self.CollectionStoragePath = /storage/OmuzeoNFTCollection
        self.CollectionPublicPath = /public/OmuzeoNFTCollection
        self.AdminStoragePath = /storage/OmuzeoNFTAdmin

        // Initialize the total supply
        self.totalSupply = 0

        // Create a Minter resource and save it to storage
        let admin <- create Admin()
        self.account.save(<-admin, to: self.AdminStoragePath)

        emit ContractInitialized()
    }
}

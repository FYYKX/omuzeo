import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  CircularProgress,
  Modal,
  TextField,
  Typography,
} from '@mui/material';
import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';
import LockedContent from '../assets/locked-item.png';
import useTransactionProgress from '../hooks/useTransactionProgress';

function NFT({ address, id, type }) {
  const [open, setOpen] = React.useState(false);
  const [metadata, setMetadata] = useState({ price: 20, isLoading: true });
  const {
    setIsTransactionInProgress,
    getTransactionProgressComponent,
    setGenericTransactionMessageOnLoading,
    setGenericTransactionMessageOnFailure,
    setGenericTransactionMessageOnSuccess,
  } = useTransactionProgress();

  useEffect(() => {
    let cdc;
    if (type.endsWith('OmuzeoNFT.NFT')) {
      cdc = `import NonFungibleToken from 0xNonFungibleToken
        import OmuzeoNFT from 0xOmuzeoNFT

        pub fun main(address: Address, id: UInt64): OmuzeoNFT.Item {
          return OmuzeoNFT.fetch(address, itemID: id)
        }`;
    } else {
      cdc = `import NonFungibleToken from 0xNonFungibleToken
          import OmuzeoItems from 0xOmuzeoItems

          pub struct Item {
            pub let id: UInt64
            pub let metadata: String
            pub let owner: Address
            pub let type: String

            init(id: UInt64, metadata: String, owner: Address, type: String) {
              self.id = id
              self.metadata = metadata
              self.owner = owner
              self.type = type
            }
          }

          pub fun main(address: Address, id: UInt64): Item {
            let item = OmuzeoItems.fetch(address, itemID: id)!
            return Item(id: item.id, metadata: item.metadata, owner: address, type: "OmuzeoItems")
          }`;
    }
    fcl
      .send([fcl.script(cdc), fcl.args([fcl.arg(address, t.Address), fcl.arg(Number(id), t.UInt64)])])
      .then(fcl.decode)
      .then((result) => {
        console.log(result);
        return result;
      })
      .then(setMetadata)
      .catch(console.log);
  }, [address, id, type]);

  async function createTickets(total) {
    setGenericTransactionMessageOnLoading();
    setIsTransactionInProgress(true);
    let txId;
    try {
      txId = await fcl.send([
        fcl.transaction(`
          import NonFungibleToken from 0xNonFungibleToken
          import OmuzeoNFT from 0xOmuzeoNFT

          transaction(id: UInt64, total: UInt64) {
            let collectionRef: &OmuzeoNFT.Collection

            prepare(acct: AuthAccount) {
              self.collectionRef = acct.borrow<&OmuzeoNFT.Collection>(from: OmuzeoNFT.CollectionStoragePath)!
            }

            execute {
              self.collectionRef.createTickets(id: id, total: total)
              log("create tickets")
            }
          }
        `),
        fcl.args([fcl.arg(Number(id), t.UInt64), fcl.arg(Number(total), t.UInt64)]),
        fcl.proposer(fcl.authz),
        fcl.payer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(1000),
      ]);
    } catch (error) {
      console.log(error);
      setGenericTransactionMessageOnFailure();
      setIsTransactionInProgress(false);
      return;
    }

    fcl.tx(txId).subscribe((tx) => {
      if (tx.errorMessage) {
        console.log(tx);
        setGenericTransactionMessageOnFailure();
        setIsTransactionInProgress(false);
        return;
      }
      if (fcl.tx.isSealed(tx)) {
        console.log('%ccreate ticket success!', 'color: limegreen;');
        setGenericTransactionMessageOnSuccess();
      }
      setIsTransactionInProgress(false);
    });
  }

  async function sell() {
    setGenericTransactionMessageOnLoading();
    setIsTransactionInProgress(true);
    setOpen(false);
    const { id, price, creator } = metadata;
    let txId, cdc, args;
    try {
      if (creator) {
        cdc = `import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FlowToken from 0xFlowToken
        import OmuzeoNFT from 0xOmuzeoNFT
        import NFTStorefront from 0xNFTStorefront

        transaction(saleItemID: UInt64, saleItemPrice: UFix64, creator: Address) {
          let owner: Capability<&FlowToken.Vault{FungibleToken.Receiver}>
          let creator: Capability<&FlowToken.Vault{FungibleToken.Receiver}>
          let omuzeoNFTProvider: Capability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>
          let storefront: &NFTStorefront.Storefront

          prepare(acct: AuthAccount) {
            let omuzeoNFTCollectionProviderPrivatePath = /private/OmuzeoNFTCollectionProviderForNFTStorefront

            self.owner = acct.getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            assert(self.owner.borrow() != nil, message: "Missing or mis-typed FlowToken receiver")

            self.creator = getAccount(creator).getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            assert(self.creator.borrow() != nil, message: "Missing or mis-typed FlowToken receiver")

            if !acct.getCapability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath)!.check() {
              acct.link<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath, target: OmuzeoNFT.CollectionStoragePath)
            }

            self.omuzeoNFTProvider = acct.getCapability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath)!
            assert(self.omuzeoNFTProvider.borrow() != nil, message: "Missing or mis-typed OmuzeoNFT.Collection provider")

            self.storefront = acct.borrow<&NFTStorefront.Storefront>(from: NFTStorefront.StorefrontStoragePath)
              ?? panic("Missing or mis-typed NFTStorefront Storefront")
          }

          execute {
            let ownerSaleCut = NFTStorefront.SaleCut(
              receiver: self.owner,
              amount: saleItemPrice * 0.7
            )
            let creatorSaleCut = NFTStorefront.SaleCut(
              receiver: self.creator,
              amount: saleItemPrice * 0.3
            )
            self.storefront.createListing(
              nftProviderCapability: self.omuzeoNFTProvider,
              nftType: Type<@OmuzeoNFT.NFT>(),
              nftID: saleItemID,
              salePaymentVaultType: Type<@FlowToken.Vault>(),
              saleCuts: [ownerSaleCut, creatorSaleCut]
            )
          }
        }`;
        args = [fcl.arg(Number(id), t.UInt64), fcl.arg(price.toFixed(2), t.UFix64), fcl.arg(creator, t.Address)];
      } else {
        cdc = `import FungibleToken from 0xFungibleToken
        import NonFungibleToken from 0xNonFungibleToken
        import FlowToken from 0xFlowToken
        import OmuzeoNFT from 0xOmuzeoNFT
        import NFTStorefront from 0xNFTStorefront

        transaction(saleItemID: UInt64, saleItemPrice: UFix64) {
          let flowReceiver: Capability<&FlowToken.Vault{FungibleToken.Receiver}>
          let omuzeoNFTProvider: Capability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>
          let storefront: &NFTStorefront.Storefront

          prepare(acct: AuthAccount) {
            let omuzeoNFTCollectionProviderPrivatePath = /private/OmuzeoNFTCollectionProviderForNFTStorefront

            self.flowReceiver = acct.getCapability<&FlowToken.Vault{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
            assert(self.flowReceiver.borrow() != nil, message: "Missing or mis-typed FlowToken receiver")

            if !acct.getCapability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath)!.check() {
              acct.link<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath, target: OmuzeoNFT.CollectionStoragePath)
            }

            self.omuzeoNFTProvider = acct.getCapability<&OmuzeoNFT.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>(omuzeoNFTCollectionProviderPrivatePath)!
            assert(self.omuzeoNFTProvider.borrow() != nil, message: "Missing or mis-typed OmuzeoNFT.Collection provider")

            self.storefront = acct.borrow<&NFTStorefront.Storefront>(from: NFTStorefront.StorefrontStoragePath)
              ?? panic("Missing or mis-typed NFTStorefront Storefront")
          }

          execute {
            let saleCut = NFTStorefront.SaleCut(
              receiver: self.flowReceiver,
              amount: saleItemPrice
            )
            self.storefront.createListing(
              nftProviderCapability: self.omuzeoNFTProvider,
              nftType: Type<@OmuzeoNFT.NFT>(),
              nftID: saleItemID,
              salePaymentVaultType: Type<@FlowToken.Vault>(),
              saleCuts: [saleCut]
            )
          }
        }`;
      }
      txId = await fcl.send([
        fcl.transaction(cdc),
        fcl.args(args),
        fcl.proposer(fcl.authz),
        fcl.payer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(1000),
      ]);
    } catch (error) {
      console.log(error);
      setGenericTransactionMessageOnFailure();
      setIsTransactionInProgress(false);
      return;
    }

    fcl.tx(txId).subscribe((tx) => {
      if (tx.errorMessage) {
        console.log(tx);
        setGenericTransactionMessageOnFailure();
        setIsTransactionInProgress(false);
        return;
      }
      if (fcl.tx.isSealed(tx)) {
        console.log('%clisting ticket success!', 'color: limegreen;');
        setGenericTransactionMessageOnSuccess();
      }

      setIsTransactionInProgress(false);
    });
  }

  async function view() {
    setMetadata({
      ...metadata,
      isLoading: true,
    });
    let txId;
    try {
      txId = await fcl.send([
        fcl.transaction(`
        import NonFungibleToken from 0xNonFungibleToken
        import OmuzeoNFT from 0xOmuzeoNFT

        transaction(id: UInt64) {
          let collection: &OmuzeoNFT.Collection

          prepare(signer: AuthAccount) {
            self.collection = signer.borrow<&OmuzeoNFT.Collection>(from: OmuzeoNFT.CollectionStoragePath)
              ?? panic("Could not borrow a reference to the collection")
          }

          execute {
            self.collection.borrowMetadata(id: id)
          }
        }`),
        fcl.args([fcl.arg(Number(id), t.UInt64)]),
        fcl.proposer(fcl.authz),
        fcl.payer(fcl.authz),
        fcl.authorizations([fcl.authz]),
        fcl.limit(100),
      ]);
    } catch (error) {
      console.log(error);
      return;
    }
    fcl.tx(txId).subscribe((tx) => {
      if (tx.errorMessage) {
        console.log(tx);
        return;
      }
      if (fcl.tx.isSealed(tx)) {
        console.log(tx);
        const { data } = tx.events.find((e) => e.type.includes('OmuzeoNFT.View'));

        setMetadata({
          ...metadata,
          metadata: data.metadata,
        });
      }
    });
  }

  if (metadata.isLoading) {
    return <CircularProgress />;
  }

  console.log('mdata', metadata);

  const addEntry = (label, value) => (
    <Box sx={{ display: 'flex' }} style={{ marginBottom: '8px' }}>
      <Box style={{ minWidth: 100 }}>
        <Typography style={{ color: 'grey' }}>{`${label} `}</Typography>
      </Box>
      <Box>
        <Typography>{value}</Typography>
      </Box>
    </Box>
  );

  const showNftCard = () => (
    <Box container fluid>
      {metadata.metadata && <CardMedia component="img" image={metadata.metadata} alt={metadata.id} />}
      <CardContent>
        <div style={{ width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {addEntry(metadata.type, `@${metadata.owner || metadata.creator}`)}
              {/*<Box style={{ marginBottom: '8px' }}>*/}
              {/*  <Typography style={{ color: 'grey' }}>{`${metadata.type} `}</Typography>*/}
              {/*  <Typography>@{metadata.owner || metadata.creator}</Typography>*/}
              {/*</Box>*/}

              {addEntry('identifier', metadata.id)}
              {/*<Box>*/}
              {/*  <Typography style={{ color: 'grey', fontSize: '12px' }}>{`IDENTIFIER ${metadata.id}`}</Typography>*/}
              {/*</Box>*/}
              {/*{metadata.metadata && metadata.metadata.price && (*/}
              {/*  <Box>*/}
              {/*    <Typography variant="h4" display="inline">{`${metadata.metadata.price.toFixed(2)}`}</Typography>*/}
              {/*  </Box>*/}
              {/*)}*/}
              {/*<Box>*/}
              {/*  <Typography variant="h4" display="inline">{`${(20).toFixed(2)}`}</Typography>*/}
              {/*  {'  '}*/}
              {/*  <Typography variant="caption" display="inline">*/}
              {/*    FLOW*/}
              {/*  </Typography>*/}
              {/*</Box>*/}
            </Box>
            <Box>{/*TODO: What to place here?*/}</Box>
          </Box>
        </div>
      </CardContent>
    </Box>
  );

  const showNftCardDebugVersion = () => (
    <>
      <CardHeader title={metadata.id} />
      {metadata.metadata && <CardMedia component="img" height="140" image={metadata.metadata} alt={metadata.id} />}
      <CardContent>
        <Typography>{metadata.owner || metadata.creator}</Typography>
        <Button variant="contained" color={type === 'OmuzeoNFT.NFT' ? 'primary' : 'success'}>
          {type}
        </Button>
        <Button variant="outlined" color={metadata.type === 'creator' ? 'primary' : 'info'}>
          {metadata.type}
        </Button>
      </CardContent>
    </>
  );

  const showImageAndInfo = () => {
    return (
      <>
        <CardMedia component="img" image={LockedContent} alt="Locked content" />
        <CardContent>
          <div style={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box style={{ marginBottom: '8px' }}>
                  <Typography style={{ color: 'grey' }}>{`${metadata.type} `}</Typography>
                  <Typography>@{metadata.creator}</Typography>
                </Box>
                <Box style={{ marginBottom: '18px' }}>
                  <Typography style={{ color: 'grey', fontSize: '12px' }}>{`IDENTIFIER ${metadata.id}`}</Typography>
                </Box>
                <Box>
                  <Typography variant="h4" display="inline">{`${(20).toFixed(2)}`}</Typography>
                  {'  '}
                  <Typography variant="caption" display="inline">
                    FLOW
                  </Typography>
                </Box>
              </Box>
              <Box>
                {/*TODO: Implement likes feature*/}
                <FavoriteBorderIcon fontSize="small" style={{ color: 'grey' }} />
              </Box>
            </Box>
          </div>
        </CardContent>
      </>
    );
  };

  if (metadata.isLoading) {
    return <CircularProgress />;
  }

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    // width: 400,
    bgcolor: 'background.paper',
    borderRadius: '10px',
    boxShadow: 24,
    paddingX: 20,
    paddingY: 20,
  };

  const handlePriceChange = (evt) => {
    if (isNaN(evt.target.value)) return;
    setMetadata({ ...metadata, price: Number(evt.target.value) });
  };

  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={style}>
          <Box sx={{ display: 'flex', marginBottom: '10px' }}>
            <TextField
              label="Price"
              variant="standard"
              size="small"
              value={metadata.price ? metadata.price : ''}
              // type="number"
              onChange={handlePriceChange}
              style={{ marginRight: '10px' }}
            />
            <Typography variant="h4" sx={{ alignSelf: 'flex-end' }} style={{ marginRight: '10px' }}>
              FLOW
            </Typography>
          </Box>
          <Button variant="contained" onClick={sell} size="large">
            Submit
          </Button>
        </Box>
      </Modal>
      {getTransactionProgressComponent()}
      <Card sx={{ maxWidth: 350, padding: '10px' }}>
        {showNftCard()}
        <CardActions>
          {address !== metadata.creator && (
            <Button variant="contained" onClick={() => createTickets(5)}>
              Create 5 Tickets
            </Button>
          )}
          {metadata.type === 'owner' && <Button onClick={view}>View</Button>}
          <Button variant="contained" onClick={() => setOpen(true)}>
            Sell
          </Button>
        </CardActions>
      </Card>
    </>
  );
}

export default NFT;

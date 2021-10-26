const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { File, NFTStorage } = require('nft.storage');
const fcl = require('@onflow/fcl');
const t = require('@onflow/types');
const SHA3 = require('sha3').SHA3;
const EC = require('elliptic').ec;

const ec = new EC('p256');
const upload = multer({ dest: 'uploads/' });
const app = express();
const port = 3000;

const apiKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDQxQWFFQjBEZkNmMEJhNDM0ZDAyOGY3ODc1NTREMjQ1NmVGMTRGODEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzNDM3ODM3MzIzNSwibmFtZSI6Im9tdXNlbyJ9.z32KODE2Z-DBcc1unmtCA6N04JnLWOu557pg7W1NUnc';
const client = new NFTStorage({ token: apiKey });

const pk = 'aaf786845222b661d397fc4a9a188ca2adeb7b6c723637da281757552e878f5b';
const admin = '0x8984ae801f05c39a';

require('dotenv').config();

fcl
  .config()
  .put('accessNode.api', process.env.ACCESS_NODE || 'https://access-testnet.onflow.org')
  .put('discovery.wallet', process.env.WALLET_DISCOVERY || 'https://fcl-discovery.onflow.org/testnet/authn')
  .put('0xNonFungibleToken', process.env.NON_FUNGIBLE_TOKEN || '0x631e88ae7f1d7c20')
  .put('0xOmuzeoItems', process.env.OMUZEO_ITEMS_CONTRACT || admin)
  .put('0xOmuzeoNFT', process.env.OMUZEO_NFT_CONTRACT || admin);

function sign(privateKey, message) {
  const key = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'));
  const sha = new SHA3(256);
  sha.update(Buffer.from(message, 'hex'));
  const digest = sha.digest();
  const sig = key.sign(digest);
  const n = 32;
  const r = sig.r.toArrayLike(Buffer, 'be', n);
  const s = sig.s.toArrayLike(Buffer, 'be', n);
  return Buffer.concat([r, s]).toString('hex');
}

const authorizationFunction = () => {
  return async (account) => {
    const user = await getAccount(admin);
    const key = user.keys[0];

    return {
      ...account,
      tempId: `${user.address}-${key.index}`,
      addr: fcl.sansPrefix(user.address),
      keyId: Number(key.index),
      signingFunction: (signable) => {
        return {
          addr: fcl.withPrefix(user.address),
          keyId: Number(key.index),
          signature: sign(pk, signable.message),
        };
      },
    };
  };
};

getAccount = async (addr) => {
  const { account } = await fcl.send([fcl.getAccount(addr)]);
  return account;
};

app.post('/create', upload.single('image'), async (req, res) => {
  try {
    const metadata = await client.store({
      name: req.body.name,
      description: req.body.name,
      image: new File([await fs.promises.readFile(req.file.path)], req.file.filename, {
        type: req.file.mimetype,
      }),
    });
    const authorization = authorizationFunction();
    const txId = await fcl.send([
      fcl.transaction`
      import NonFungibleToken from 0xNonFungibleToken
      import OmuzeoItems from 0xOmuzeoItems

      transaction(recipient: Address, metadata: String) {
        let minter: &OmuzeoItems.NFTMinter

        prepare(signer: AuthAccount) {
          self.minter = signer.borrow<&OmuzeoItems.NFTMinter>(from: OmuzeoItems.MinterStoragePath)
            ?? panic("Could not borrow a reference to the NFT minter")
        }

        execute {
          let recipient = getAccount(recipient)

          let receiver = recipient
            .getCapability(OmuzeoItems.CollectionPublicPath)!
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not get receiver reference to the NFT Collection")

          self.minter.mintNFT(recipient: receiver, metadata: metadata)
        }
      }`,
      fcl.args([fcl.arg(req.body.receiver, t.Address), fcl.arg(metadata.embed().image.href, t.String)]),
      fcl.proposer(authorization),
      fcl.authorizations([authorization]),
      fcl.payer(authorization),
      fcl.limit(1000),
    ]);
    const result = await fcl.tx(txId).onceSealed();
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.post('/createOmuzeoNFT', upload.single('image'), async (req, res) => {
  try {
    // const metadata = await client.store({
    //   name: req.body.name,
    //   description: req.body.name,
    //   image: new File([await fs.promises.readFile(req.file.path)], req.file.filename, {
    //     type: req.file.mimetype,
    //   }),
    // });
    // console.log(metadata);
    const authorization = authorizationFunction();
    const txId = await fcl.send([
      fcl.transaction`
      import NonFungibleToken from 0xNonFungibleToken
      import OmuzeoNFT from 0xOmuzeoNFT

      transaction(creator: Address, metadata: String) {
        let admin: &OmuzeoNFT.Admin

        prepare(signer: AuthAccount) {
          self.admin = signer.borrow<&OmuzeoNFT.Admin>(from: OmuzeoNFT.AdminStoragePath)
            ?? panic("Could not borrow a reference to the NFT minter")
        }

        execute {
          let receiver = getAccount(creator)
            .getCapability(OmuzeoNFT.CollectionPublicPath)!
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not get receiver reference to the NFT Collection")

          self.admin.mintNFT(recipient: receiver, metadata: metadata, creator: creator)
        }
      }`,
      // fcl.args([fcl.arg(req.body.creator, t.Address), fcl.arg(metadata.embed().image.href, t.String)]),
      fcl.args([
        fcl.arg(req.body.creator, t.Address),
        fcl.arg('https://images.unsplash.com/photo-1635138639693-746199e59716', t.String),
      ]),
      fcl.proposer(authorization),
      fcl.authorizations([authorization]),
      fcl.payer(authorization),
      fcl.limit(1000),
    ]);
    const result = await fcl.tx(txId).onceSealed();
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

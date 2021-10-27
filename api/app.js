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

require('dotenv').config();

const apiKey =
  process.env.OMUZEO_API_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDQxQWFFQjBEZkNmMEJhNDM0ZDAyOGY3ODc1NTREMjQ1NmVGMTRGODEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzNDM3ODM3MzIzNSwibmFtZSI6Im9tdXNlbyJ9.z32KODE2Z-DBcc1unmtCA6N04JnLWOu557pg7W1NUnc';

const client = new NFTStorage({ token: apiKey });

const pk = process.env.OMUZEO_PK || '97874405d76faffbf102bedbd510b21c912db5bd41851159413a9b65b8ac28fe';
const admin = process.env.OMUZEO_ADMIN || '0x149f6592e6bbd04f';

console.log('access node ', process.env.ACCESS_NODE)
console.log('wallet discovery ', process.env.WALLET_DISCOVERY)
console.log('omuzeo admin ', process.env.OMUZEO_ADMIN)
console.log('omuzeo items contract ', process.env.OMUSEO_CONTRACT)
console.log('omuzeo pk (trimmed) ', process.env.OMUZEO_PK.substr(0, 4));
console.log('omuzeo api key (trimmed) ', process.env.OMUZEO_API_KEY.substr(62, 4))
console.log('omuzeo nonfungible token ', process.env.OMUZEO_NONFUNGIBLE_TOKEN);

fcl
  .config()
  .put('accessNode.api', process.env.ACCESS_NODE || 'https://access-testnet.onflow.org')
  .put('discovery.wallet', process.env.WALLET_DISCOVERY || 'https://fcl-discovery.onflow.org/testnet/authn')
  .put('0xNonFungibleToken', process.env.OMUZEO_NONFUNGIBLE_TOKEN || '0x631e88ae7f1d7c20')
  .put('0xOmuzeoItems', process.env.OMUSEO_CONTRACT || admin);

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
    var response = await fcl.send([
      fcl.transaction`
    	import NonFungibleToken from 0xNonFungibleToken
    	import OmuzeoItems from "0xOmuzeoItems"

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
    			self.minter.mintNFT(recipient: receiver, metadata: metadata)
    		}
    	}`,
      fcl.args([fcl.arg(req.body.receiver, t.Address), fcl.arg(metadata.embed().image.href, t.String)]),
      fcl.proposer(authorization),
      fcl.authorizations([authorization]),
      fcl.payer(authorization),
      fcl.limit(9999),
    ]);
    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.get('/transfer/:receiver/:id', async (req, res) => {
  try {
    const authorization = authorizationFunction();
    const metadata = {
      lastOwner: admin,
    };
    var response = await fcl.send([
      fcl.transaction`
				import OmuseoContract from 0xOmuseoContract;

				transaction(receiver: Address, id: UInt64, metadata: {String : String}) {
					let transferToken: @OmuseoContract.NFT

					prepare(acct: AuthAccount) {
						let collectionRef = acct.borrow<&OmuseoContract.Collection>(from: /storage/NFTCollection)
							?? panic("Could not borrow a reference to the owner's collection")

						self.transferToken <- collectionRef.withdraw(withdrawId: id)
					}

					execute {
						let receiverRef = getAccount(receiver).getCapability<&{OmuseoContract.NFTReceiver}>(/public/NFTReceiver)
							.borrow()
							?? panic("Could not borrow receiver reference")

						receiverRef.deposit(token: <-self.transferToken, metadata: metadata)
					}
				}
			`,
      fcl.args([
        fcl.arg(req.params.receiver, t.Address),
        fcl.arg(parseInt(req.params.id), t.UInt64),
        fcl.arg(
          Object.keys(metadata).map((k, i) => {
            return { key: k, value: metadata[k] };
          }),
          t.Dictionary({ key: t.String, value: t.String }),
        ),
      ]),
      fcl.proposer(authorization),
      fcl.authorizations([authorization]),
      fcl.payer(authorization),
      fcl.limit(9999),
    ]);
    var transaction = await fcl.tx(response).onceSealed();

    res.send(transaction);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.get('/nft', async (req, res) => {
  try {
    const ids = await fcl
      .send([
        fcl.script`
				import OmuseoContract from 0xOmuseoContract;
				pub fun main() : [UInt64] {
					return OmuseoContract.ownerMap.keys
				}
			`,
      ])
      .then(fcl.decode);
    ids.sort((a, b) => a - b);
    res.send(ids);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.get('/nft/:address/:id', async (req, res) => {
  try {
    const nft = await fcl
      .send([
        fcl.script`
					import OmuseoContract from 0xOmuseoContract;

					pub fun main(address: Address, id: UInt64) : {String : String} {
						let nftOwner = getAccount(address)
						let receiverRef = nftOwner.getCapability<&{OmuseoContract.NFTReceiver}>(/public/NFTReceiver)
							.borrow()
							?? panic("Could not borrow receiver reference")
						return receiverRef.getMetadata(id: id)
					}
				`,
        fcl.args([fcl.arg(parseInt(req.params.address), t.Address), fcl.arg(parseInt(req.params.id), t.UInt64)]),
      ])
      .then(fcl.decode);
    res.send(nft);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.get('/account/:address', async (req, res) => {
  const { account } = await fcl.send([fcl.getAccount(req.params.address)]);
  const authorization = authorizationFunction();
  const collection = await fcl
    .send([
      fcl.script`
			import OmuseoContract from 0xOmuseoContract;

			pub fun main(address: Address): Bool {
				let receiverRef = getAccount(address).getCapability<&{OmuseoContract.NFTReceiver}>(/public/NFTReceiver)
					.borrow()
					?? panic("Could not borrow receiver reference")
				return receiverRef == nil ? false : true
			}
		`,
      fcl.args([fcl.arg(req.params.address, t.Address)]),
      fcl.proposer(authorization),
      fcl.authorizations([authorization]),
      fcl.payer(authorization),
      fcl.limit(9999),
    ])
    .then(fcl.decode);
  const ids = await fcl
    .send([
      fcl.script`
			import OmuseoContract from 0xOmuseoContract;

			pub fun main(address: Address): [UInt64] {
				let nftOwner = getAccount(address)
				let receiverRef = nftOwner.getCapability<&{OmuseoContract.NFTReceiver}>(/public/NFTReceiver)
					.borrow()
					?? panic("Could not borrow receiver reference")
				return receiverRef.getIds()
			}
		`,
      fcl.args([fcl.arg(req.params.address, t.Address)]),
      fcl.proposer(authorization),
      fcl.authorizations([authorization]),
      fcl.payer(authorization),
      fcl.limit(9999),
    ])
    .then(fcl.decode);

  res.send({
    account,
    collection,
    ids,
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

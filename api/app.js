const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { File, NFTStorage } = require("nft.storage");
const fcl = require("@onflow/fcl");
const t = require("@onflow/types");
const SHA3 = require("sha3").SHA3;
const EC = require("elliptic").ec;

const ec = new EC("p256");
const upload = multer({ dest: "uploads/" });
const app = express();
const port = 3000;

const apiKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDQxQWFFQjBEZkNmMEJhNDM0ZDAyOGY3ODc1NTREMjQ1NmVGMTRGODEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzNDM3ODM3MzIzNSwibmFtZSI6Im9tdXNlbyJ9.z32KODE2Z-DBcc1unmtCA6N04JnLWOu557pg7W1NUnc";
const client = new NFTStorage({ token: apiKey });

const pk = "2fb9217f49d12e9e19ebbf19b0252b71bbd357870d29c3311bfd948b96ce129f";
const admin = "0x6de22766222b4344";

fcl.config()
	.put("env", "testnet")
	.put("accessNode.api", "https://access-testnet.onflow.org")
	.put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn")
	.put("0xOmuseoContract", admin);

function sign(privateKey, message) {
	const key = ec.keyFromPrivate(Buffer.from(privateKey, "hex"));
	const sha = new SHA3(256);
	sha.update(Buffer.from(message, "hex"));
	const digest = sha.digest();
	const sig = key.sign(digest);
	const n = 32;
	const r = sig.r.toArrayLike(Buffer, "be", n);
	const s = sig.s.toArrayLike(Buffer, "be", n);
	return Buffer.concat([r, s]).toString("hex");
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

app.post("/create", upload.single("image"), async (req, res) => {
	try {
		const metadata = await client.store({
			name: "omuseo",
			description: "omuseo",
			image: new File([await fs.promises.readFile(req.file.path)], req.file.filename, {
				type: req.file.mimetype,
			}),
		});
		console.log(metadata);
		const authorization = authorizationFunction();
		var item = {
			name: req.body.text,
			uri: metadata.url,
		};
		var response = await fcl.send([
			fcl.transaction`
				import OmuseoContract from 0xOmuseoContract;
				transaction(metadata: {String : String}) {
					let receiverRef: &{OmuseoContract.NFTReceiver}
					let minterRef: &OmuseoContract.NFTMinter

					prepare(acct: AuthAccount) {
						self.receiverRef = acct.getCapability<&{OmuseoContract.NFTReceiver}>(/public/NFTReceiver)
							.borrow()
							?? panic("Could not borrow receiver reference")
						self.minterRef = acct.borrow<&OmuseoContract.NFTMinter>(from: /storage/NFTMinter)
							?? panic("Could not borrow minter reference")
					}

					execute {
						let newNFT <- self.minterRef.mint()
						self.receiverRef.deposit(token: <-newNFT, metadata: metadata)
						log("NFT Minted and deposited to Account 2's Collection")
					}
				}
			`,
			fcl.args([
				fcl.arg(
					Object.keys(item).map((k, i) => {
						return { key: k, value: item[k] };
					}),
					t.Dictionary({ key: t.String, value: t.String })
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

app.get("/nft", async (req, res) => {
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

app.get("/nft/:id", async (req, res) => {
	try {
		const nft = await fcl
			.send([
				fcl.script`
					import OmuseoContract from 0xOmuseoContract;
					pub fun main(id: UInt64) : {String : String} {
						let nftOwner = getAccount(0x6de22766222b4344)
						let receiverRef = nftOwner.getCapability<&{OmuseoContract.NFTReceiver}>(/public/NFTReceiver)
							.borrow()
							?? panic("Could not borrow receiver reference")
						return receiverRef.getMetadata(id: id)
					}
				`,
				fcl.args([fcl.arg(parseInt(req.params.id), t.UInt64)]),
			])
			.then(fcl.decode);
		res.send(nft);
	} catch (error) {
		console.log(error);
		res.status(500).send(error);
	}
});

app.get("/account/:address", async (req, res) => {
	const { account } = await fcl.send([fcl.getAccount(req.params.address)]);
	res.send(account);
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});

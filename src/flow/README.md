# set up flow cli
`flow init --reset`

# set up emulator
`flow emulator --persist`

note: when starting the emulator again, use `flow emulator start`

# set up account
`flow keys generate`
```
flow accounts create \
> --key <public key> \
> --sig-algo "ECDSA_P256" \
> --signer "emulator-account"
```

# set up flow config
```
{
...
	"contracts": {
		<contract-name>: "..<contract-filename>.cdc"
	},
	
	"accounts": {
		...
		<role-account>: {
			"address": "0x...",
			"key": {
				"type": "hex",
				"index": 0,
				"signatureAlgorithm": "ECDSA_P256",
				"hashAlgorithm": "SHA3_256",
				"privateKey": "..."
			}
		}
	},

	"deployments": {
		"emulator": {
			<role-account>: [
				<contract-key>
			]
		}
	}
}
```
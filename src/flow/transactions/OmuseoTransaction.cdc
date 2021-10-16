// Execute on command line
// step 1 - build the transaction
// flow transactions build src/flow/transactions/OmuseoTransaction.cdc \
// > --authorizer emulator-artist \
// > --proposer emulator-artist \
// > --payer emulator-artist \
//
// step 2 - sign the transaction
// flow transactions sign ./transaction.build.rlp \
// > --signer emulator-artist \
// > --filter payload \
// > --save transaction.build.rlp \
// > -y
//
// step 3 - send the signed transaction to the Flow network
// flow transactions send-signed ./transaction.build.rlp
//
// or using the shortcut
//
// flow transaction send src/flow/transactions/OmuseoTransaction.cdc \
// > --signer emulator-artist \

import OmuseoContract from "./../contracts/OmuseoContract.cdc"

transaction {
	let name: String

	prepare(account: AuthAccount) {
		self.name = account.address.toString()
	}

	execute {
		OmuseoContract.sayHi(to: self.name)
	}
}

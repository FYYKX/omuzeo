import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';
import Card from './components/Card';

const SignInOutButton = ({ user: { loggedIn } }) => {
  const signInOrOut = async (event) => {
    event.preventDefault();

    if (loggedIn) {
      fcl.unauthenticate();
    } else {
      fcl.authenticate();
    }
  };

  return <button onClick={signInOrOut}>{loggedIn ? 'Sign Out' : 'Sign In/Up'}</button>;
};

const ActiveCollectionButton = () => {
  const activeCollection = async (event) => {
    event.preventDefault();

    try {
      const transactionId = await fcl
        .send([
          fcl.transaction`
          import OmuseoContract from 0xOmuseoContract

          transaction {
            prepare(acct: AuthAccount) {
              let collection <- OmuseoContract.createEmptyCollection()
              acct.save<@OmuseoContract.Collection>(<-collection, to: /storage/NFTCollection)
              acct.link<&{OmuseoContract.NFTReceiver}>(/public/NFTReceiver, target: /storage/NFTCollection)
            }
          }
        `,
          fcl.args([]),
          fcl.payer(fcl.authz),
          fcl.proposer(fcl.authz),
          fcl.authorizations([fcl.authz]),
          fcl.limit(9999),
        ])
        .then(fcl.decode);
      console.log(transactionId);

      const result = await fcl.tx(transactionId).onceSealed();
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={activeCollection}>Setup Account</button>;
};

const CurrentUser = () => {
  const [user, setUser] = useState({});
  const [hasCollection, setHasCollection] = useState(false);

  const checkCollection = async (address) => {
    try {
      const collection = await fcl
        .send([
          fcl.script`
            import OmuseoContract from 0xOmuseoContract
            pub fun main(address: Address) : Bool {
              let collectionRef = getAccount(address).getCapability<&{OmuseoContract.NFTReceiver}>(/public/NFTReceiver)
                .borrow()
                ?? panic("Could not borrow receiver reference")
              return collectionRef == nil ? false : true
            }
          `,
          fcl.args([fcl.arg(address, t.Address)]),
          fcl.payer(fcl.authz),
          fcl.proposer(fcl.authz),
          fcl.authorizations([fcl.authz]),
          fcl.limit(9999),
        ])
        .then(fcl.decode);
      setHasCollection(collection);
    } catch (error) {
      console.log(error);
      setHasCollection(false);
    }
  };

  useEffect(() => {
    fcl.currentUser().subscribe((user) => {
      setUser({ ...user });
      console.log(user);
      console.log(hasCollection);
      if (user.loggedIn) {
        checkCollection(user.addr);
      }
    });
  }, [hasCollection]);

  return (
    <Card>
      <SignInOutButton user={user} />
      {!hasCollection && <ActiveCollectionButton />}
    </Card>
  );
};

export default CurrentUser;

import * as fcl from '@onflow/fcl';
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

const SetupAccountButton = () => {
  const setupAccount = async (event) => {
    event.preventDefault();

    try {
      const transactionId = await fcl.send([
        fcl.transaction`
          import OmuseoContract from 0x6de22766222b4344

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
        fcl.limit(9999)
      ]).then(fcl.decode);
      console.log(transactionId);

      const result = await fcl.tx(transactionId).onceSealed();
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={setupAccount}>Setup Account</button>;
};

const CurrentUser = () => {
  const [user, setUser] = useState({});

  useEffect(() => fcl.currentUser().subscribe((user) => setUser({ ...user })), []);

  return (
    <Card>
      <SetupAccountButton/>
      <SignInOutButton user={user} />
    </Card>
  );
};

export default CurrentUser;

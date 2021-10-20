import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';
import React, { useEffect, useState } from 'react';
import Card from './components/Card';
import axios from "axios";

const SigninButton = () => {
  const signIn = async (event) => {
    event.preventDefault();

    fcl.authenticate();
  };

  return <button onClick={signIn}>{'Sign In/Up'}</button>;
};

const SignoutButton = () => {
  const signOut = async (event) => {
    event.preventDefault();

    fcl.unauthenticate();
  };

  return <button onClick={signOut}>{'Sign Out'}</button>;
};

const ActivateCollectionButton = () => {
  const activateCollection = async (event) => {
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
      return false;
    }
  };

  return <button onClick={activateCollection}>Activate Collection</button>;
};

const CurrentUser = () => {
  const [user, setUser] = useState({});
  const [hasCollection, setHasCollection] = useState(false);

  const [nftArtName, setNftArtName] = useState(null);
  const [nftArtImage, setNftArtImage] = useState(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState(null);

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

  const showActivateCollection = () => {
    if (!user?.loggedIn) return <></>;
    if (hasCollection) return <></>;
    return <ActivateCollectionButton />;
  };

  const handleSubmitForm = (evt) => {
    evt.preventDefault()

    const data = new FormData()
    data.append("receiver", user.addr)
    data.append("name", nftArtName)
    data.append("image", nftArtImage, nftArtName + '.jpg')

    setUploadSuccessMsg('Please wait while we upload your image')

    axios.post("/create", data, {
      headers: {
        'Content-Type': "multipart/form-data"
      }
    })
      .then(response => {
        if(response.status === 200) {
          setUploadSuccessMsg(`You've successfully uploaded ${nftArtName}!`)
        } else {
          setUploadSuccessMsg('Something went wrong. Please try uploading again!')
        }
        console.log(response);
      })
      .catch(error => {
        console.error(error)
      })

  };

  const handleNameChange = (evt) => {
    setNftArtName(evt.target.value)
    setUploadSuccessMsg(null)
  };

  const handleUpload = (evt) => {
    setNftArtImage(evt.target.files[0])
    setUploadSuccessMsg(null)
  };

  const showMintForm = () => {
    return (
      <>
      <form onSubmit={handleSubmitForm}>
        <input type="text" onChange={handleNameChange} placeholder="Name" />
        <br/>
        <input type="file" onChange={handleUpload} />
        <input type="submit" />
      </form>
        <br/>
        {uploadSuccessMsg ? <span>{uploadSuccessMsg}</span> : null}
      </>
    );
  };

  if (!user?.loggedIn)
    return (
      <Card>
        <SigninButton />
      </Card>
    );

  return (
    <>
      <Card>
        <SignoutButton />
        {showActivateCollection()}
      </Card>
      {showMintForm()}
    </>
  );
};

export default CurrentUser;

import * as fcl from '@onflow/fcl';

fcl
  .config()
  .put('accessNode.api', process.env.REACT_APP_ACCESS_NODE || 'https://access-testnet.onflow.org')
  .put('discovery.wallet', process.env.REACT_APP_WALLET_DISCOVERY || 'https://fcl-discovery.onflow.org/testnet/authn')
  .put('discovery.wallet.method', 'HTTP/POST')
  .put('service.OpenID.scopes', 'email!')
  .put('0xFungibleToken', process.env.REACT_APP_FUNGIBLE_TOKEN || '0x9a0766d93b6608b7')
  .put('0xFlowToken', process.env.REACT_APP_FLOW_TOKEN || '0x7e60df042a9c0868')
  .put('0xNonFungibleToken', process.env.REACT_APP_NONFUNGIBLE_TOKEN || '0x631e88ae7f1d7c20')
  .put('0xNFTStorefront', process.env.REACT_APP_NFT_STOREFRONT || '0x94b06cfca1d8a476')
  .put('0xOmuzeoItems', process.env.REACT_APP_OMUZEO_ITEMS || '0x8984ae801f05c39a')
  .put('0xOmuzeoNFT', process.env.REACT_APP_OMUZEO_NFT || '0x8984ae801f05c39a');

fcl.config().all().then(console.log);

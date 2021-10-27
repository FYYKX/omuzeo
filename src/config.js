import * as fcl from '@onflow/fcl';

// TODO: add correct env for qa deployment with blocto wallet
// .put('challenge.scope', 'email') // request for Email
// .put('accessNode.api', 'https://access-testnet.onflow.org') // Flow testnet
// .put('discovery.wallet', 'https://flow-wallet-testnet.blocto.app/api/flow/authn') // Blocto testnet wallet
// .put('discovery.wallet.method', 'HTTP/POST')
// .put('service.OpenID.scopes', 'email!');
// console.log('REACT_APP_OMUSEO_CONTRACT ', process.env.REACT_APP_OMUSEO_CONTRACT)
// fcl
//   .config()
//   .put('accessNode.api', process.env.REACT_APP_ACCESS_NODE || 'http://localhost:8080')
//   .put('challenge.handshake', process.env.REACT_APP_WALLET_DISCOVERY || 'http://localhost:8701/fcl/authn')
//   .put('0xOmuseoContract', process.env.REACT_APP_OMUSEO_CONTRACT || '0xf8d6e0586b0a20c7');
console.log('access node', process.env.REACT_APP_ACCESS_NODE);
console.log('wallet discovery ', process.env.REACT_APP_WALLET_DISCOVERY);
console.log('fungible token ', process.env.REACT_APP_FUNGIBLE_TOKEN);
console.log('flow token ', process.env.REACT_APP_FLOW_TOKEN);
console.log('nonfungible token ', process.env.REACT_APP_NONFUNGIBLE_TOKEN);
console.log('nft storefront', process.env.REACT_APP_NFT_STOREFRONT);
console.log('omuzeo items', process.env.REACT_APP_OMUZEO_ITEMS);

fcl
  .config()
  .put('accessNode.api', process.env.REACT_APP_ACCESS_NODE || 'https://access-testnet.onflow.org')
  .put('discovery.wallet', process.env.REACT_APP_WALLET_DISCOVERY || 'https://fcl-discovery.onflow.org/testnet/authn')
  .put('0xFungibleToken', process.env.REACT_APP_FUNGIBLE_TOKEN || '0x9a0766d93b6608b7')
  .put('0xFlowToken', process.env.REACT_APP_FLOW_TOKEN || '0x7e60df042a9c0868')
  .put('0xNonFungibleToken', process.env.REACT_APP_NONFUNGIBLE_TOKEN || '0x631e88ae7f1d7c20')
  .put('0xNFTStorefront', process.env.REACT_APP_NFT_STOREFRONT || '0x94b06cfca1d8a476')
  .put('0xOmuzeoItems', process.env.REACT_APP_OMUZEO_ITEMS || '0x149f6592e6bbd04f');


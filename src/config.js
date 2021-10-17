import * as fcl from '@onflow/fcl';

// TODO: add correct env for qa deployment with blocto wallet
// .put('challenge.scope', 'email') // request for Email
// .put('accessNode.api', 'https://access-testnet.onflow.org') // Flow testnet
// .put('discovery.wallet', 'https://flow-wallet-testnet.blocto.app/api/flow/authn') // Blocto testnet wallet
// .put('discovery.wallet.method', 'HTTP/POST')
// .put('service.OpenID.scopes', 'email!');
fcl
  .config()
  .put('accessNode.api', process.env.REACT_APP_ACCESS_NODE || 'http://localhost:8080')
  .put('challenge.handshake', process.env.REACT_APP_WALLET_DISCOVERY || 'http://localhost:8701/fcl/authn')
  .put('0xOmuseoContract', process.env.REACT_APP_OMUSEO_CONTRACT);

import { config } from '@onflow/fcl';

// TODO: add correct env for production deployment
config()
  .put('challenge.scope', 'email') // request for Email
  .put('accessNode.api', 'https://access-testnet.onflow.org') // Flow testnet
  .put('discovery.wallet', 'https://flow-wallet-testnet.blocto.app/api/flow/authn') // Blocto testnet wallet
  .put('discovery.wallet.method', 'HTTP/POST')
  .put('service.OpenID.scopes', 'email!');
// config for fcl dev wallet
// .put("accessNode.api", "http://localhost:8080")
// .put("challenge.handshake", "http://localhost:8701/flow/authenticate")

'use strict';

const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');  // development only
const fetch = require('node-fetch');
const { TextDecoder, TextEncoder } = require('util');
// const endPoint = 'http://127.0.0.1:8888';  // local
const endPoints = [
    'https://api-kylin.eosasia.one',
    'https://api-kylin.eoslaomao.com',
    'https://api.kylin.alohaeos.com',
    'https://kylin.eoscanada.com',
    'http://kylin.meet.one:8888',
    'http://kylin.fn.eosbixin.com',
    'http://api-kylin.starteos.io',
    'http://api.kylin.helloeos.com.cn',
    'http://kylin-testnet.jeda.one:8888',
    'http://api.kylin.eosbeijing.one:8880'
  ];
// const admin = 'mobiuspanda1';
const admin = 'signuphelper';
const adminPublicKey = 'EOS52rVr4RMqW9NJir3r7dW4j33Yh7oiATCM2gKM2SpQobfeysaRZ';
// const privateKey1 = "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3";
const privateKey1 = '5JnLe2Xd6JFDSnwC9qCenaagtKjfwNTFPsHz2CcPZTXmrczaFKs';
const privateKeys = [privateKey1];
const signatureProvider = new JsSignatureProvider(privateKeys);
const rpc = new JsonRpc(endPoints[4], { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
const symbol = 'MBPD';
const tokenTable = 'tokens';
const resource = {
  bytes: 50 * 1024,
  balance: '1.0000 EOS',
  stake_net_quantity: '2.0000 EOS',
  stake_cpu_quantity: '2.0000 EOS',
};

var config = {
    endPoint: endPoints[0],
    admin: admin,
    adminPublicKey: adminPublicKey,
    privateKeys: privateKeys,
    rpc: rpc,
    api: api,
    symbol: symbol,
    tokenTable: tokenTable,
    resource: resource
}

module.exports = config;
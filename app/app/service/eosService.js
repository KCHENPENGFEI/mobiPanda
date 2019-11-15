'use strict';

const Service = require('egg').Service;
const serviceConfig = require('./config');

class EosService extends Service {
    async issuePanda(to, tokenSymbol, uri, memo) {
        const admin = serviceConfig.admin;
        const result = await serviceConfig.api.transact({
            actions: [{
                account: admin,
                name: 'issuenft',
                authorization: [{
                    actor: admin,
                    permission: 'active'
                }],
                data: {
                    to: to,
                    symbol: tokenSymbol,
                    uris: uri,
                    memo: memo
                },
            }]
        },
        {
            blocksBehind: 3,
            expireSeconds: 60   
        }).then(() => {
            console.log('isuue panda success');
            return {code: 0, msg: ''};
        }).catch(error => {
            console.log('issue panda failed, ' + error);
            this.ctx.logger.error(new Date(), to, error.message);
            return {code: -1, msg: error.message};
        });
        return result;
    }
    
    async createNewAccount(account, pubKey) {
        const admin = serviceConfig.admin;
        const adminPubKey = serviceConfig.adminPublicKey;
        const resource = serviceConfig.resource;
        const result = await serviceConfig.api.transact({
            actions: [{
                account: 'eosio',
                name: 'newaccount',
                authorization: [{
                    actor: admin,
                    permission: 'active'
                }],
                data: {
                    creator: admin,
                    name: account,
                    owner: {
                        threshold: 1,
                        keys: [{
                            key: adminPubKey,
                            weight: 1
                        }],
                        accounts: [],
                        waits: []
                    },
                    active: {
                        threshold: 1,
                        keys: [{
                            key: pubKey,
                            weight: 1
                        }],
                        accounts: [],
                        waits: []
                    }
                }
            },
            {
                account: 'eosio',
                name: 'buyrambytes',
                authorization: [{
                    actor: admin,
                    permission: 'active'
                }],
                data: {
                    payer: admin,
                    receiver: account,
                    bytes: resource.bytes
                }
            }, 
            {
                account: 'eosio',
                name: 'delegatebw',
                authorization: [{
                    actor: admin,
                    permission: 'active'
                }],
                data: {
                    from: admin,
                    receiver: account,
                    stake_net_quantity: resource.stake_net_quantity,
                    stake_cpu_quantity: resource.stake_cpu_quantity,
                    transfer: false
                }
            }]
        }, 
        {
            blocksBehind: 3,
            expireSeconds: 60
        }).then(() => {
            console.log('signup success');
            return {code: 0, msg: ''};
        }).catch(error => {
            console.log('signup failed, ' + error.message);
            this.ctx.logger.error(new Date(), account, error.message);
            return {code: -1, msg: error.message};
        });
        // const result = await serviceConfig.api.transaction( tr => {
        //     tr.newaccount({
        //         creator: admin,
        //         name: account,
        //         owner: pubKey,
        //         active: pubKey
        //     });

        //     tr.buyrambytes({
        //         payer: admin,
        //         receiver: account,
        //         bytes: resource.bytes
        //     });

        //     tr.delegatebw({
        //         from: admin,
        //         receiver: account,
        //         stake_net_quantity: resource.stake_net_quantity,
        //         stake_cpu_quantity: resource.stake_cpu_quantity,
        //         transfer: 0,
        //     });

        //     tr.transfer(admin, account, resource.balance, 'welcome');
        // }).then(() => {
        //     console.log('signup success');
        //     return true;
        // }).catch(error => {
        //     console.log('issue panda failed, ' + error);
        //     return false;
        // });

        return result;
    }

    async getAccount(account) {
        try {
            const result = await serviceConfig.rpc.get_account(account);
            if (result.account_name === account) {
                return {code: 0, msg: ''};
            }
            else {
                return {code: -1, msg: 'not an account'};
            }
        } catch (e) {
            this.logger.error(new Date(), account, e.message, '用户不存在');
            return {code: -1, msg: e.message};
        }
    }

    async checkPanda(account) {
        const contract = serviceConfig.admin;
        const tokenTable = serviceConfig.tokenTable;
        const resp = await serviceConfig.rpc.get_table_rows({
            json: true,
            code: contract,
            table: tokenTable,
            scope: contract,
            index_position: '3',
            table_key: 'owner',
            key_type: 'i64',
            lower_bound: ' ' + account,
            upper_bound: ' ' + account,
            limit: 50,
            reverse: false,
            show_payer: false
        });
        // console.log(resp.rows);
        return resp.rows;
    }

    async checkPandaByUuid(uuid) {
        const contract = serviceConfig.admin;
        const tokenTable = serviceConfig.tokenTable;
        const resp = await serviceConfig.rpc.get_table_rows({
            json: true,
            code: contract,
            table: tokenTable,
            scope: contract,
            index_position: '2',
            table_key: 'uuid',
            key_type: 'i128',
            lower_bound: uuid,
            upper_bound: uuid,
            limit: 1,
            reverse: false,
            show_payer: false
        });
        return resp.rows;
    }

}

module.exports = EosService;


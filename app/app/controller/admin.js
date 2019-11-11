'use strict';

const Controller = require('egg').Controller;
const wechatApi = require('../service/wechatApiConfig');
const Api = require('../api/api');
const Utils = require('../utils/utils');
const ecc = require('eosjs-ecc');
const sha1 = require('js-sha1');
const OSS = require('ali-oss');
const ossConfig = require('../service/ossConfig');
const STS = OSS.STS;
const sts = new STS({
    accessKeyId: ossConfig.accessKeyId,
    accessKeySecret: ossConfig.accessKeySecret
});


class adminController extends Controller {
    async getUserInfo() {
        let params = this.ctx.query;
        const code = params.code;
        const status = params.status;
        // get access_token 
        const getAccessTokenUrl = wechatApi.wechatOauth2MainUrl + 
        'access_token?appid=' + wechatApi.appId + '&secret=' + wechatApi.appSecret + 
        '&code=' + code + '&grant_type=authorization_code';
        let response = await this.service.admin.httpGetContent(getAccessTokenUrl);
        if (JSON.stringify(response) === '{}') {
            const api = JSON.parse(JSON.stringify(Api.httpErrorApi));
            api.data.error = httpRequest.status;
            this.ctx.body = api;
            return;
        }
        else {
            if (response.errcode === undefined) {
                // get access token success
                const access_token = response.access_token;
                const refresh_token = response.refresh_token;
                const openid = response.openid;
                //console.log('openid: ', openid);

                // to get user info
                const getUserInfoUrl = wechatApi.wechatUserInfoMainUrl +
                'access_token=' + access_token + '&openid=' + openid + '&lang=zh_CN';

                let response1 = await this.service.admin.httpGetContent(getUserInfoUrl);
                if (JSON.stringify(response1) === '{}') {
                    const api = JSON.parse(JSON.stringify(Api.httpErrorApi));
                    api.data.error = httpRequest.status;
                    this.ctx.body = api;
                    return;    
                }
                else {
                    if (response1.errcode === undefined) {
                        // get user info success
                        const result = await this.service.users.loginAndRegister(openid);
                        if (JSON.stringify(result) === '{}') {
                            const api = JSON.parse(JSON.stringify(Api.loginFailedApi));
                            api.data.error = '注册失败';
                            this.ctx.body = api;
                            return;
                        }
                        else {
                            const api = JSON.parse(JSON.stringify(Api.loginSucccessApi));
                            api.data.EOSAccount = result.EOSAccount;
                            api.data.nickname = response1.nickname;
                            api.data.headimgurl = response1.headimgurl;
                            api.data.openid = openid;
                            this.ctx.body = api;
                            // console.log('account: ', result.EOSAccount);
                            return;
                        }
                    }
                    else {
                        const api = JSON.parse(JSON.stringify(Api.loginFailedApi));
                        api.data.error = response1.errmsg;
                        this.ctx.body = api;
                        return;
                    }
                }
            }
            else {
                const api = JSON.parse(JSON.stringify(Api.loginFailedApi));
                api.data.error = response.errmsg;
                this.ctx.body = api;
                return;
            }
        }
    }

    async getSign() {
        let msg = this.ctx.query;
        let url = msg.url;
        console.log("getSign");
        let now = Date.parse(new Date()) / 1000;
        let nonceStr = Utils.generateRandomPartGeneId(10);
        let jsapiTicket = await this.service.admin.getTicket(now);
        if (jsapiTicket === '') {
            const api = JSON.parse(JSON.stringify(Api.getSignFailedApi));
            api.data.error = 'jsapi ticket null';
            this.ctx.body = api;
        }
        else {
            let str = 'jsapi_ticket=' + jsapiTicket + '&noncestr=' + nonceStr + '&timestamp=' + now + '&url=' + url;
            let signature = sha1(str);
            // console.log('signature: ', signature);
            const api = JSON.parse(JSON.stringify(Api.getSignSuccessApi));
            api.data.nonceStr = nonceStr;
            api.data.timestamp = now;
            api.data.signature = signature;
            this.ctx.body = api;
        }
    }

    async getOssToken() {
        let policy = {
            "Statement": [
                {
                    "Action": "oss:*",
                    "Effect": "Allow",
                    "Resource": ["acs:oss:*:*:mobipanda/*"]
                }
            ],
            "Version": "1"
        };
        try {
            let now = Date.parse(new Date()) / 1000;
            const api = JSON.parse(JSON.stringify(Api.getOssTokenSuccessApi));
            if (now - ossConfig.gencredentialsTime > 3600) {
                // upgrade
                let token = await sts.assumeRole(
                    ossConfig.roleArn, policy, 60 * 60, 'session'
                );
                api.data.credentials = token.credentials;
                api.data.expireTime = 60 * 60;
                ossConfig.credentials = token.credentials;
                ossConfig.gencredentialsTime = now;
                this.ctx.body = api;
            }
            else {
                api.data.credentials = ossConfig.credentials;
                api.data.expireTime = ossConfig.gencredentialsTime + 60 * 60 - now;
                this.ctx.body = api;
            }
        } catch (e) {
            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            api.data.error = 'get oss token failed';
            console.log('error: ', e.message);
            this.ctx.body = api;
        }
    }
    
    async register() {
        let msg = this.ctx.request.body;
        let account = msg.account;
        let priKey = await ecc.randomKey();
        let pubKey = ecc.privateToPublic(priKey);
        console.log(priKey);
        console.log(pubKey);
        let signupResult = await this.ctx.service.eosService.createNewAccount(account, pubKey);
        this.ctx.body = signupResult;
    }
}


module.exports = adminController;
'use strict';

const Controller = require('egg').Controller;
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
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

// const httpRequest = new XMLHttpRequest();
// const httpRequest1 = new XMLHttpRequest();

class adminController extends Controller {
    async getUserInfo() {
        let params = this.ctx.query;
        const code = params.code;
        const status = params.status;
        // get access_token 
        const getAccessTokenUrl = wechatApi.wechatOauth2MainUrl + 
        'access_token?appid=' + wechatApi.appId + '&secret=' + wechatApi.appSecret + 
        '&code=' + code + '&grant_type=authorization_code';
        const httpRequest = new XMLHttpRequest();
        httpRequest.open('GET', getAccessTokenUrl, false);
        httpRequest.send();
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            const getAccessTokenResponse = JSON.parse(httpRequest.responseText);
            if (getAccessTokenResponse.errcode === undefined) {
                // success
                const access_token = getAccessTokenResponse.access_token;
                const refresh_token = getAccessTokenResponse.refresh_token;
                const openid = getAccessTokenResponse.openid;

                // get user info
                const getUserInfoUrl = wechatApi.wechatUserInfoMainUrl +
                'access_token=' + access_token + '&openid=' + openid + '&lang=zh_CN';
                const httpRequest1 = new XMLHttpRequest();
                httpRequest1.open('GET', getUserInfoUrl, false);
                httpRequest1.send();
                if (httpRequest1.readyState === 4 && httpRequest1.status === 200) {
                    const getUserInfoResponse = JSON.parse(httpRequest1.responseText);
                    if (getUserInfoResponse.errcode === undefined) {
                        // success
                        // console.log('userInfo: ', getUserInfoResponse);
                        const loginResult = await this.service.users.login(openid);
                        if (loginResult === null) {
                            // register users in database
                            const registerResult = await this.service.users.register(openid);
                            if (registerResult) {
                                // register success
                                const api = JSON.parse(JSON.stringify(Api.loginSucccessApi));
                                api.data.EOSAccount = '';
                                api.data.nickname = getUserInfoResponse.nickname;
                                api.data.headimgurl = getUserInfoResponse.headimgurl;
                                api.data.openid = openid;
                                this.ctx.body = api;
                            }
                            else {
                                // register error
                                const api = JSON.parse(JSON.stringify(Api.loginFailedApi));
                                api.data.error = 'register failed';
                                this.ctx.body = api;
                            }
                        }
                        else {
                            // has allready registered
                            const api = JSON.parse(JSON.stringify(Api.loginSucccessApi));
                            api.data.EOSAccount = loginResult.EOSAccount;
                            api.data.nickname = getUserInfoResponse.nickname;
                            api.data.headimgurl = getUserInfoResponse.headimgurl;
                            api.data.openid = openid;
                            this.ctx.body = api;
                        }
                        // const httpRequest2 = new XMLHttpRequest();
                        // const loginUrl = 'http://127.0.0.1:7001/user/login';
                        // httpRequest2.open('POST', loginUrl, false);
                        // httpRequest2.setRequestHeader("Content-Type", "application/json");
                        // var data = JSON.stringify({
                        //     openid: openid
                        // });
                        // httpRequest2.send(data);
                        // if (httpRequest2.readyState === 4 && httpRequest2.status === 200) {
                        //     console.log(httpRequest2.responseText);
                        //     const loginResult = httpRequest2.responseText;

                        // }
                    }
                    else {
                        const api = JSON.parse(JSON.stringify(Api.loginFailedApi));
                        api.data.error = getUserInfoResponse.errmsg;
                        this.ctx.body = api;
                    }
                }
                else {
                    // failed
                    const api = JSON.parse(JSON.stringify(Api.httpErrorApi));
                    api.data.error = httpRequest1.status;
                    this.ctx.body = api;
                }
            }
            else {
                const api = JSON.parse(JSON.stringify(Api.loginFailedApi));
                api.data.error = getAccessTokenResponse.errmsg;
                this.ctx.body = api;
            }
        }
        else {
            const api = JSON.parse(JSON.stringify(Api.httpErrorApi));
            api.data.error = httpRequest.status;
            this.ctx.body = api;
        }
    }

    async getSign() {
        // let url = this.ctx.href;
        let msg = this.ctx.query;
        let url = msg.url;
        console.log("getSign");
        // let at = wechatApi.accessToken;
        // let jt = wechatApi.jsapiTicket;
        // let atStartTime = wechatApi.accessTokenTimeStamp;
        // let jtStartTime = wechatApi.jsapiTicketTimeStamp;
        // let jtUrl = wechatApi.getJaspiTicketUrl;
        // let expiresIn = wechatApi.expiresIn;
        let now = Date.parse(new Date()) / 1000;
        let nonceStr = Utils.generateRandomPartGeneId(10);
        let jsapiTicket = await this.getTicket(now);
        if (jsapiTicket === '') {
            const api = JSON.parse(JSON.stringify(Api.getSignFailedApi));
            api.data.error = 'jsapi ticket null';
            this.ctx.body = api;
        }
        else {
            let str = 'jsapi_ticket=' + jsapiTicket + '&noncestr=' + nonceStr + '&timestamp=' + now + '&url=' + url;
            let signature = sha1(str);
            console.log('signature: ', signature);
            const api = JSON.parse(JSON.stringify(Api.getSignSuccessApi));
            api.data.nonceStr = nonceStr;
            api.data.timestamp = now;
            api.data.signature = signature;
            this.ctx.body = api;
        }
    }

    async getTicket(time) {
        let at = wechatApi.accessToken;
        let jt = wechatApi.jsapiTicket;
        let atStartTime = wechatApi.accessTokenTimeStamp;
        let jtStartTime = wechatApi.jsapiTicketTimeStamp;
        let jtUrl = wechatApi.getJaspiTicketUrl;
        let expiresIn = wechatApi.expiresIn;
        console.log('time: ', new Date(time * 1000).getHours());
        console.log('jtTime: ', jtStartTime);
        if (new Date(time * 1000).getHours() === jtStartTime) {
            // no need to upgrade
            return jt;
        }
        else {
            // upgrade access token and jsapi ticket
            const httpRequest = new XMLHttpRequest();
            httpRequest.open('GET', wechatApi.getAccessTokenUrl, false);
            httpRequest.send();
            if (httpRequest.readyState === 4 && httpRequest.status === 200) {
                let response = JSON.parse(httpRequest.responseText);
                if (response.errcode === undefined) {
                    // success
                    at = response.access_token;
                    jtUrl = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + at + '&type=jsapi';
                    atStartTime = time;
                    console.log('get access token success');
                }
                else {
                    console.log('get access token failed:', response);
                    return '';
                }
            }
            else {
                console.log('get access token failed');
                return '';
            }
            const httpRequest1 = new XMLHttpRequest();
            httpRequest1.open('GET', jtUrl, false);
            httpRequest1.send();
            if (httpRequest1.readyState === 4 && httpRequest1.status === 200) {
                let response = JSON.parse(httpRequest1.responseText);
                if (response.errcode === 0) {
                    // success
                    jt = response.ticket;
                    jtStartTime = new Date(time * 1000).getHours();
                    console.log('get jsapi ticket success');
                    return jt;
                }
                else {
                    console.log('get jsapi ticket failed');
                    return '';
                }
            }
            else {
                console.log('get jsapi ticket failed');
                return '';
            }
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
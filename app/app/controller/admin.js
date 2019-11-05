'use strict';

const Controller = require('egg').Controller;
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const wechatApi = require('../service/wechatApiConfig');
const Api = require('../api/api');
const ecc = require('eosjs-ecc');

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
'use strict';

const appId = 'wx5c246d27ec421534';
const appSecret = '915fa6327c8c5ad75aabfb0fb9dad737';
const redirectUri = 'yyh.arvinlearn.com';
var accessToken = '';
var jsapiTicket = '';
var accessTokenTimeStamp = 0;
var jsapiTicketTimeStamp = 0;
var expiresIn = 3600;

const wechatOauth2MainUrl = 'https://api.weixin.qq.com/sns/oauth2/';
const wechatUserInfoMainUrl = 'https://api.weixin.qq.com/sns/userinfo?';
// const accessTokenMainUrl = ''
var getJaspiTicketUrl = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=jsapi';
var getAccessTokenUrl = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appId + '&secret=' + appSecret;

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const httpRequest = new XMLHttpRequest();
httpRequest.open('GET', getAccessTokenUrl, false);
httpRequest.send();
if (httpRequest.readyState === 4 && httpRequest.status === 200) {
    const getAccessTokenResponse = JSON.parse(httpRequest.responseText);
    if (getAccessTokenResponse.errcode === undefined) {
        // success
        accessToken = getAccessTokenResponse.access_token;
        accessTokenTimeStamp = Date.parse(new Date()) / 1000;
        getJaspiTicketUrl = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + accessToken + '&type=jsapi';
        console.log('get access token success: ', accessToken);
    }
    else {
        console.log('get access token failed:', getAccessTokenResponse);
    }
}

const httpRequest1 = new XMLHttpRequest();
httpRequest1.open('GET', getJaspiTicketUrl, false);
httpRequest1.send();
if (httpRequest1.readyState === 4 && httpRequest1.status === 200) {
    const getJsapiTicketResponse = JSON.parse(httpRequest1.responseText);
    if (getJsapiTicketResponse.errcode === 0) {
        // success
        jsapiTicket = getJsapiTicketResponse.ticket;
        jsapiTicketTimeStamp = new Date().getHours();
        console.log('get jsapi ticket success: ', jsapiTicket);
    }
    else {
        console.log('get jsapi ticket failed:', getJsapiTicketResponse);
    }
}

module.exports = {
    appId, 
    appSecret,
    redirectUri,
    wechatOauth2MainUrl,
    wechatUserInfoMainUrl,
    getJaspiTicketUrl,
    getAccessTokenUrl,
    accessToken,
    expiresIn,
    jsapiTicket,
    accessTokenTimeStamp,
    jsapiTicketTimeStamp
};
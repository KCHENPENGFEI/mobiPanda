'use strict';

const Service = require('egg').Service;
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const wechatApi = require('./wechatApiConfig');

class adminService extends Service {
    async httpGetContent(url) {
        const httpRequest = new XMLHttpRequest();
        httpRequest.open('GET', url, false);
        httpRequest.send();
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            const respose = JSON.parse(httpRequest.responseText);
            return respose;
        }
        else {
            return {};
        }
    }

    async getTicket(time) {
        let at = wechatApi.accessToken;
        let jt = wechatApi.jsapiTicket;
        let atStartTime = wechatApi.accessTokenTimeStamp;
        let jtStartTime = wechatApi.jsapiTicketTimeStamp;
        let jtUrl = wechatApi.getJaspiTicketUrl;
        // let expiresIn = wechatApi.expiresIn;
        console.log('time: ', new Date(time * 1000).getHours());
        console.log('jtTime: ', jtStartTime);
        if (new Date(time * 1000).getHours() === jtStartTime) {
            // no need to upgrade
            return jt;
        }
        else {
            // upgrade access token and jsapi ticket
            let response = await this.httpGetContent(wechatApi.getAccessTokenUrl);
            if (JSON.stringify(response) === '{}') {
                console.log('get access token failed:', response);
                return '';
            }
            else {
                if (response.errcode === undefined) {
                    // get access token success
                    at = response.access_token;
                    wechatApi.accessToken = at;
                    // console.log("access_token: ", at);
                    jtUrl = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + at + '&type=jsapi';
                    wechatApi.getJaspiTicketUrl = jtUrl;
                    // console.log("jtUrl: ", jtUrl);
                    atStartTime = time;
                    wechatApi.accessTokenTimeStamp = atStartTime;
                    console.log('get access token success');
                }
                else {
                    console.log('get access token failed:', response);
                    return '';                   
                }
            }

            let ticketRes = await this.httpGetContent(jtUrl);
            if (JSON.stringify(ticketRes) === '{}') {
                console.log('get jsapi ticket failed:', ticketRes);
                return '';
            }
            else {
                if (ticketRes.errcode === 0) {
                    // get ticket success
                    jt = ticketRes.ticket;
                    wechatApi.jsapiTicket = jt;
                    jtStartTime = new Date(time * 1000).getHours();
                    wechatApi.jsapiTicketTimeStamp = jtStartTime;
                    console.log('get jsapi ticket success');
                    // console.log('ticket: ', jt);
                    return jt;
                }
                else {
                    console.log('get jsapi ticket failed');
                    return '';
                }
            }
        }
    }
}

module.exports = adminService;
'use strict';

const appId = 'wx5c246d27ec421534';
const appSecret = '915fa6327c8c5ad75aabfb0fb9dad737';
const redirectUri = 'api.zjugoa.club/mbus/mobiPanda';

const wechatOauth2MainUrl = 'https://api.weixin.qq.com/sns/oauth2/';
const wechatUserInfoMainUrl = 'https://api.weixin.qq.com/sns/userinfo?';

module.exports = {
    appId, 
    appSecret,
    redirectUri,
    wechatOauth2MainUrl,
    wechatUserInfoMainUrl
};
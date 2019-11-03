/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {
    // security: {
    //   csrf: {
    //     enable: false,
    //   },
    // }
  };

  // exports.security = {
  //   csrf: false
  // };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1572274354508_7245';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  config.security = {
    csrf: {
      // bodyName: '_csrf',
      // headerName: 'x-csrf-token',
      enable: false,
    },
    domainWhiteList: [ 'yyh.arvinlearn.com','localhost' ]
  };

  config.cors = {
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS'
  };

  config.mysql = {
    // 单数据库信息配置
    client: {
      // host
      host: 'localhost',
      // 端口号
      port: '3306',
      // 用户名
      user: 'root',
      // 密码
      password: 'WOkg2012sjmr,.bos',
      // 数据库名
      database: 'mobiPanda',
    },
    app: true,
    agent: false,
  };

  config.cluster = {
    listen: {
      port: 7001,
      hostname: '127.0.0.1'
    }
  };

  return {
    ...config,
    ...userConfig,
  };
};

// exports.mysql = {
//   // 单数据库信息配置
//   client: {
//     // host
//     host: 'localhost',
//     // 端口号
//     port: '3306',
//     // 用户名
//     user: 'root',
//     // 密码
//     password: 'WOkg2012sjmr,.bos',
//     // 数据库名
//     database: 'testDB',
//   },
//   // 是否加载到 app 上，默认开启
//   app: true,
//   // 是否加载到 agent 上，默认关闭
//   agent: false,
// };

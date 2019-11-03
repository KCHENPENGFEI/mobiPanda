'use strict';

const userRouter = require('./routers/user');
const adminRouter = require('./routers/admin');

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  userRouter(app);
  adminRouter(app);
};

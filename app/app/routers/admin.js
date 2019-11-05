'use strict';

module.exports = app => {
    const { router, controller } = app;
    router.get('/admin/getUserInfo', controller.admin.getUserInfo);
    router.post('/admin/register', controller.admin.register);
};
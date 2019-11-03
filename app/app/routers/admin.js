'use strict';

module.exports = app => {
    const { router, controller } = app;
    router.get('/admin/getUserInfo', controller.admin.getUserInfo);
};
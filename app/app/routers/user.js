'use strict';

module.exports = app => {
    const { router, controller } = app;
    router.post('/user/issue', controller.user.issue);
    router.get('/user/checkIssue', controller.user.checkIssue);
    router.post('/user/issueAgain', controller.user.issueAgain);
    router.get('/user/pandaList', controller.user.pandaList)
    router.get('/user/getPanda', controller.user.getPanda);
    router.get('/user/getCharacter', controller.user.getCharacter);
    router.get('/user/getInBoxes', controller.user.getInBoxes);
    router.post('/user/transferPanda', controller.user.transferPanda);
    router.post('/user/test', controller.user.test);
};
'use strict';

module.exports = app => {
    const { router, controller } = app;
    router.post('/user/login', controller.user.login);
    router.post('/user/issue', controller.user.issue);
    router.get('/user/checkIssue', controller.user.checkIssue);
    router.post('/user/issueAgain', controller.user.issueAgain);
    router.get('/user/pandaList', controller.user.pandaList)
    router.get('/user/getPanda', controller.user.getPanda);
<<<<<<< HEAD
    router.get('/user/getCharacter', controller.user.getCharacter);
    router.get('/user/getInBoxes', controller.user.getInBoxes);
    router.post('/user/transferPanda', controller.user.transferPanda);
=======
>>>>>>> eb8a69a79decebf983f5392601b61b9bc0cf2f92
    router.post('/user/test', controller.user.test);
};
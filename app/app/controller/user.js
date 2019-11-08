'use strict';

const Controller = require('egg').Controller;
const Api = require('../api/api');
const Utils = require('../utils/utils');
const serviceConfig = require('../service/config');
const BN = require('bn.js');


class userController extends Controller {
    async login() {
        // const user = 'cpfzju';
        // const symbol = 'MBPD';
        // const memo = 'eosjsTest';
        // this.ctx.body = await this.service.eosService.issuePanda(user, symbol, memo);
        let msg = this.ctx.request.body;
        const result = await this.service.users.login(msg.openid);
        if (result === null) {
            // register users in database
            const registerResult = await this.service.users.register(msg.openid);
            if (registerResult) {
                // register success
                const api = JSON.parse(JSON.stringify(Api.loginSucccessApi));
                api.data.EOSAccount = '';
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
            api.data.EOSAccount = result.EOSAccount;
            this.ctx.body = api;
        }
    }

    async issue() {
        let start = new Date();
        let msg = this.ctx.request.body;
        let openid = msg.openid;                 // user's openid
        let EOSAccount = msg.EOSAccount;         // user's eos account
        let EOSPublicKey = msg.EOSPublicKey;     // usre's eos public key
        let answer = msg.answer;                 // user's answer
        
        try {
            // check if openid exist
            const account = await this.ctx.service.users.checkEOSAccount(openid);
            if (account.length !== 0) {
                // let e = {message: 'allready registered'};
                // throw e;
                if (account[0].EOSAccount !== null) {
                    const api = JSON.parse(JSON.stringify(Api.issuePandaFailedApi));
                    api.data.error = 'allready registered';
                    this.ctx.body = api;
                    return;
                }
            }
            else {
                const api = JSON.parse(JSON.stringify(Api.exceptionApi));
                api.data.error = 'not registered';
                this.ctx.body = api;
                return;
            }
            // generate user's account
            let time1 = new Date();
            const signupResult = await this.ctx.service.eosService.createNewAccount(EOSAccount, EOSPublicKey);
            // const signupResult = {code: 0};
            let time2 = new Date();
            console.log('create account: ', time2.getTime() - time1.getTime());
            if (signupResult.code === 0) {
                // signup success
                // generate panda's gene
                // storage user's data
                let convertedAnswer = Utils.answerConvert(answer);
                let characterList = ['controller', 'burst', 'loneliness', 'buddhist', 'openness'];
                let character = {};
                for (var i = 0; i < convertedAnswer.length; i++) {
                    if (i === 0) {
                        continue;
                    }
                    else{
                        const cha = characterList[i - 1];
                        character[cha] = convertedAnswer[i];
                    }
                }
                let geneId = Utils.generateGeneId(answer);
                let geneIdPart = geneId.substring(0, 8);
                const characterTags = Utils.KMaxCharacter(character, 3);
                const index = Utils.geneToSeed(geneId.slice(8, 20));
                const tags = characterTags.map(charac => {
                    const texts = Utils.characterReadable[charac]
                    return texts[index % texts.length];
                });
                const firstIssueResult = await this.ctx.service.users.firstIssuePanda(openid, EOSAccount, EOSPublicKey, String(answer), geneIdPart);
                if (firstIssueResult) {
                    // generate panda on EOS
                    let time3 = new Date();
                    const issuePanda = await this.ctx.service.eosService.issuePanda(EOSAccount, serviceConfig.symbol, ['panda'], geneId);
                    let time4 = new Date();
                    console.log('issue panda: ', time4.getTime() - time3.getTime());
                    // TODO
                    if (issuePanda.code === 0) {
                        // issue success
                        // this.ctx.body = 'success';
                        // get uuid
                        let time5 = new Date();
                        const pandaTable = await this.ctx.service.eosService.checkPanda(EOSAccount);
                        let time6 = new Date();
                        console.log('check panda: ', time6.getTime() - time5.getTime());
                        if (pandaTable.length === 0) {
                            const api = JSON.parse(JSON.stringify(Api.checkPandaFailedApi));
                            api.data.error = 'no panda left';
                            this.ctx.body = api;
                        }
                        else if (pandaTable.length === 1) {
                            const pandaUuid = pandaTable[0].uuid;
                            const createTime = pandaTable[0].createtime;
                            const api = JSON.parse(JSON.stringify(Api.issuePandaSuccessApi));
                            api.data.panda.uuid = pandaUuid;
                            api.data.panda.gene = geneId;
                            const date = createTime;
                            api.data.panda.createTime = date;
                            api.data.character = character;
                            let tagsList = [];
                            for (let k = 0; k < tags.length; k++) {
                                let tag = {
                                    tageName: tags[k],
                                    rare: tags[i] in Utils.rare
                                };
                                tagsList.push(tag);
                            }
                            api.data.panda.tags = tagsList;
                            let end = new Date();
                            console.log('all cost: ', end.getTime() - start.getTime());
                            this.ctx.body = api;
                            await this.ctx.service.users.updatePandaQuantity(openid, 1, date);
                        }
                        else {
                            // more than one panda
                            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
                            api.data.error = 'not first issue';
                            this.ctx.body = api;
                        }
                        // await this.ctx.service.eosService.checkPanda(EOSAccount);
                    }
                    else {
                        // issue failed
                        const api = JSON.parse(JSON.stringify(Api.issuePandaFailedApi));
                        api.data.error = issuePanda.msg;
                        this.ctx.body = api;
                    }
                }
                else {
                    const api = JSON.parse(JSON.stringify(Api.databaseErrorApi));
                    api.data.error = 'insert error when issue panda';
                    this.ctx.body = api;
                }
            }
            else {
                // failed
                const api = JSON.parse(JSON.stringify(Api.signupFailedApi));
                api.data.error = signupResult.msg;
                this.ctx.body = api;
            }
        } catch (e) {
            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            api.data.error = e.message;
            this.ctx.body = api;
        }
    }

    async checkIssue() {
        const rankTable = {
            "0": 0,
            "1": 1,
            "2": 4,
            "3": 6,
            "4": 24
        };
        let msg = this.ctx.query;
        let openid = msg.openid;
        try {
            const selectResultList = await this.service.users.checkPandaQuantity(openid);
            const selectResult = selectResultList[0];
            let timestamp = 0;
            const pandaQuantity = selectResult.pandaQuantity;
            const lastCreateTime = selectResult.lastCreateTime;
            if (lastCreateTime === null) {
                lastCreateTime = Date.parse(new Date()) / 1000;
            }
            if (pandaQuantity >= 4) {
                timestamp = rankTable[4] * 3600;
            }
            else {
                timestamp = rankTable[pandaQuantity] * 3600;
            }
            if (Date.parse(new Date()) / 1000 - lastCreateTime > timestamp) {
                // issue next panda
                const api = JSON.parse(JSON.stringify(Api.checkIssueSuccessApi));
                api.data.status = true;
                api.data.nextTime = -1;
                this.ctx.body = api;
            }
            else {
                var api = JSON.parse(JSON.stringify(Api.checkIssueSuccessApi));
                api.msg = 'wait for next time';
                api.data.status = false;
                api.data.nextTime = lastCreateTime + timestamp;
                this.ctx.body = api;
            }
        } catch (e) {
            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            api.data.error = e.message;
            this.ctx.body = api;
        }
    }

    async issueAgain() {
        const rankTable = {
            "0": 0,
            "1": 1,
            "2": 4,
            "3": 6,
            "4": 24
        };
        let msg = this.ctx.request.body;
        let openid = msg.openid;
        try {
            const selectResultList = await this.service.users.checkPandaQuantity(openid);
            const selectResult = selectResultList[0];
            let timestamp = 0;
            const pandaQuantity = selectResult.pandaQuantity;
            const lastCreateTime = selectResult.lastCreateTime;
            if (lastCreateTime === null) {
                lastCreateTime = Date.parse(new Date()) / 1000;
            }
            if (pandaQuantity >= 4) {
                timestamp = rankTable[4] * 3600;
            }
            else {
                timestamp = rankTable[pandaQuantity] * 3600;
            }
            if (Date.parse(new Date()) / 1000 - lastCreateTime > timestamp) {
                const resultList = await this.ctx.service.users.checkPandaAccountAndAnswer(openid);
                const result = resultList[0];
                const EOSAccount = result.EOSAccount;
                const answerStr = result.answer;
                const answerLsit = answerStr.split(',');
                let answer = [];
                answer = answerLsit.map(item => {
                    return +item;
                });
                let convertedAnswer = Utils.answerConvert(answer);
                let characterList = ['controller', 'burst', 'loneliness', 'buddhist', 'openness'];
                let character = {};
                for (var i = 0; i < convertedAnswer.length; i++) {
                    if (i === 0) {
                        continue;
                    }
                    else{
                        const cha = characterList[i - 1];
                        character[cha] = convertedAnswer[i];
                    }
                }
                let genderId = '0000';
                if (answer[0] === 0) {
                    genderId = '0000';
                }
                else {
                    genderId = '0001';
                }
                let geneId = Utils.generateRandomGeneId(genderId);
                const characterTags = Utils.KMaxCharacter(character, 3);
                const index = Utils.geneToSeed(geneId.slice(8, 20));
                const tags = characterTags.map(charac => {
                    const texts = Utils.characterReadable[charac]
                    return texts[index % texts.length];
                });
                // issue panda
                const issuePanda = await this.ctx.service.eosService.issuePanda(EOSAccount, serviceConfig.symbol, ['panda'], geneId);
                if (issuePanda.code === 0) {
                    // issue success
                    // this.ctx.body = 'success';
                    // get uuid
                    const pandaTable = await this.ctx.service.eosService.checkPanda(EOSAccount);
                    if (pandaTable.length === 0) {
                        const api = JSON.parse(JSON.stringify(Api.checkPandaFailedApi));
                        api.data.error = 'no panda left';
                        this.ctx.body = api;
                    }
                    else if (pandaTable.length === 1) {
                        const pandaUuid = pandaTable[0].uuid;
                        const createTime = pandaTable[0].createtime;
                        const api = JSON.parse(JSON.stringify(Api.issuePandaAgainSuccessApi));
                        api.data.panda.uuid = pandaUuid;
                        api.data.panda.gene = geneId;
                        api.data.panda.createTime = createTime;
                        let tagsList = [];
                        for (let k = 0; k < tags.length; k++) {
                            let tag = {
                                tageName: tags[k],
                                rare: tags[i] in Utils.rare
                            };
                            tagsList.push(tag);
                        }
                        api.data.panda.tags = tagsList;
                        this.ctx.body = api;
                        await this.ctx.service.users.increasePandaQuantity(openid, 1, createTime);
                    }
                    else {
                        // more than one panda
                        // TODO
                        for (var i = 0; i < pandaTable.length; i++) {
                            const pandaGene = pandaTable[i].gene;
                            if (pandaGene === geneId) {
                                break;
                            }
                        }
                        const pandaUuid = pandaTable[i].uuid;
                        const createTime = pandaTable[i].createtime;
                        const api = JSON.parse(JSON.stringify(Api.issuePandaSuccessApi));
                        api.data.panda.uuid = pandaUuid;
                        api.data.panda.gene = geneId;
                        const date = createTime;
                        api.data.panda.createTime = date;
                        let tagsList = [];
                        for (let k = 0; k < tags.length; k++) {
                            let tag = {
                                tageName: tags[k],
                                rare: tags[i] in Utils.rare
                            };
                            tagsList.push(tag);
                        }
                        api.data.panda.tags = tagsList;
                        this.ctx.body = api;
                        await this.ctx.service.users.increasePandaQuantity(openid, 1, date);
                    }
                }
                else {
                    // issue failed
                    const api = JSON.parse(JSON.stringify(Api.issuePandaFailedApi));
                    api.data.error = issuePanda.msg;
                    this.ctx.body = api;
                }
            }
            else {
                // issue failed
                const api = JSON.parse(JSON.stringify(Api.checkIssueSuccessApi));
                api.msg = 'wait for next time to create';
                api.data.status = false;
                api.data.nextTime = lastCreateTime + timestamp;
                this.ctx.body = api;
            }
        } catch (e) {
            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            api.data.error = e.message;
            this.ctx.body = api;
        }
    }

    async pandaList() {
        let msg = this.ctx.query;
        let openid = msg.openid;
        try {
            // const EOSAccountList = await this.ctx.service.users.checkEOSAccount(openid);
            // const EOSAccount = EOSAccountList[0].EOSAccount;
            const resultList = await this.ctx.service.users.checkPandaAccountAndAnswer(openid);
            const result = resultList[0];
            const EOSAccount = result.EOSAccount;
            const answerStr = result.answer;
            const answerLsit = answerStr.split(',');
            let answer = [];
            answer = answerLsit.map(item => {
                return +item;
            });
            let convertedAnswer = Utils.answerConvert(answer);
            let characterList = ['controller', 'burst', 'loneliness', 'buddhist', 'openness'];
            let character = {};
            for (var i = 0; i < convertedAnswer.length; i++) {
                if (i === 0) {
                    continue;
                }
                else{
                    const cha = characterList[i - 1];
                    character[cha] = convertedAnswer[i];
                }
            }
            const pandasList = await this.ctx.service.eosService.checkPanda(EOSAccount);
            const api = JSON.parse(JSON.stringify(Api.pandaListSuccessApi));
            for (var i = 0; i < pandasList.length; i++) {
                let panda = pandasList[i];
                let uuid = panda.uuid;
                let gene = panda.gene;
                let createTime = panda.createtime;
                const characterTags = Utils.KMaxCharacter(character, 3);
                const index = Utils.geneToSeed(gene.slice(8, 20));
                const tags = characterTags.map(charac => {
                    const texts = Utils.characterReadable[charac]
                    return texts[index % texts.length];
                });
                let tagsList = [];
                for (let k = 0; k < tags.length; k++) {
                    let tag = {
                        tageName: tags[k],
                        rare: tags[i] in Utils.rare
                    };
                    tagsList.push(tag);
                }
                api.data.pandaList.push({
                    gene: gene,
                    uuid: uuid,
                    createTime: createTime,
                    tags: tagsList
                });
            }
            this.ctx.body = api;
        } catch (e) {
            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            api.data.error = e.message;
            this.ctx.body = api;
        }
    }

    async getPanda() {
        let msg = this.ctx.query;
        let uuid = msg.uuid;
        try {
            const getPandaResult = await this.service.eosService.checkPandaByUuid(uuid);
            let gene = getPandaResult[0].gene;
            let createTime = getPandaResult[0].createtime;
            const api = JSON.parse(JSON.stringify(Api.getPandaSuccessApi));
            api.data.panda.uuid = uuid;
            api.data.panda.gene = gene;
            api.data.panda.createTime = createTime;
            this.ctx.body = api;
        } catch (e) {
            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            api.data.error = e.message;
            this.ctx.body = api;
        }
    }

    async getCharacter() {
        let msg = this.ctx.query;
        let openid = msg.openid;
        try {
            const resultList = await this.ctx.service.users.checkPandaAccountAndAnswer(openid);
            const result = resultList[0];
            // const EOSAccount = result.EOSAccount;
            const answerStr = result.answer;
            const answerLsit = answerStr.split(',');
            let answer = [];
            answer = answerLsit.map(item => {
                return +item;
            });
            const convertedAnswer = Utils.answerConvert(answer);
            let characterList = ['controller', 'burst', 'loneliness', 'buddhist', 'openness'];
            let character = {};
            for (var i = 0; i < convertedAnswer.length; i++) {
                if (i === 0) {
                    continue;
                }
                else{
                    const cha = characterList[i - 1];
                    character[cha] = convertedAnswer[i];
                }
            }
            const api = JSON.parse(JSON.stringify(Api.getCharacterSuccessApi));
            api.data.character = character;
            this.ctx.body = api;
        } catch (e) {
            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            api.data.error = e.message;
            this.ctx.body = api;
        }
    }

    async transferPanda() {
        let msg = this.ctx.request.body;
        let senderEOSAccount = msg.senderEOSAccount;
        let receiverEOSAccount = msg.receiverEOSAccount;
        let uuid = msg.uuid;
        try {
            const receiverExist = await this.ctx.service.users.checkOpenId(receiverEOSAccount);
            if (receiverExist.length === 0) {
                let e = {message: 'receiver not exist'};
                throw e;
            }
            const result = await this.ctx.service.users.checkAnswerByAccount(senderEOSAccount);
            if (result !== null) {
                let answer = result.answer;
                const api = Api.commonSuccessApi;
                this.ctx.body = api;
                const deleteResult = await this.ctx.service.users.deleteInBoxes(receiverEOSAccount, senderEOSAccount, uuid);
                if (!deleteResult) {
                    await this.ctx.service.users.saveInBoxes(receiverEOSAccount, senderEOSAccount, uuid, answer);
                }
                await this.ctx.service.users.upgradeTansferInfo(serviceConfig.symbol);
            }
            else {
                const api = JSON.parse(JSON.stringify(Api.databaseErrorApi));
                api.data.error = 'sender check result null';
                this.ctx.body = api;
            }
        } catch (e) {
            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            api.data.error = e.message;
            this.ctx.body = api;
        }
    }

    async getInBoxes() {
        let msg = this.ctx.query;
        let openid = msg.openid;
        try {
            const EOSAccountList = await this.ctx.service.users.checkEOSAccount(openid);
            const EOSAccount = EOSAccountList[0].EOSAccount;
            const checkResult = await this.ctx.service.users.checkInBoxes(EOSAccount);
            const api = JSON.parse(JSON.stringify(Api.getInBoxesSuccessApi));
            if (checkResult.length !== 0) {
                for (let i = 0; i < checkResult.length; i++) {
                    let inBox = checkResult[i];
                    let senderEOSAccount = inBox.senderEOSAccount;
                    let uuid = inBox.uuid;
                    let answerStr = inBox.answer;
                    const answerLsit = answerStr.split(',');
                    let answer = [];
                    answer = answerLsit.map(item => {
                        return +item;
                    });
                    const convertedAnswer = Utils.answerConvert(answer);
                    let characterList = ['controller', 'burst', 'loneliness', 'buddhist', 'openness'];
                    let character = {};
                    for (let j = 0; j < convertedAnswer.length; j++) {
                        if (j === 0) {
                            continue;
                        }
                        else{
                            const cha = characterList[j - 1];
                            character[cha] = convertedAnswer[j];
                        }
                    }
                    api.data.inBoxes.push({
                        EOSAccount: senderEOSAccount,
                        uuid: uuid,
                        character: character
                    });
                }
                this.ctx.body = api;
            }
            else {
                // const api = JSON.parse(JSON.stringify(Api.databaseErrorApi));
                // api.data.error = 'check result null';
                this.ctx.body = api;
            }
        } catch (e) {
            const exceptionApi = JSON.parse(JSON.stringify(Api.exceptionApi));
            exceptionApi.data.error = e.message;
            this.ctx.body = exceptionApi;
        }
    }

    async test() {
        let msg = this.ctx.request.body;
        // let uuid = msg.uuid;
        // const a = new BN(uuid.substring(2), "hex");
        // const b = a.toBuffer("le", 16);
        // const c = new BN(b);
        // this.ctx.body = c.toString();
        // let to = msg.to;
        // let symbol = "MBPD";
        // let uris = ["panda"];
        // let memo = "123";
        // const result = await this.ctx.service.eosService.issuePanda(to, symbol, uris, memo);
        // this.ctx.body = result;
        // let receiverEOSAccount = msg.receiverEOSAccount;
        // let senderEOSAccount = msg.senderEOSAccount;
        // let uuid = msg.uuid;
        // const result = await this.service.users.deleteInBoxes(receiverEOSAccount, senderEOSAccount, uuid);
        // this.ctx.body = {result};
        let answer = msg.answer;
        let convertedAnswer = Utils.answerConvert(answer);
        let characterList = ['controller', 'burst', 'loneliness', 'buddhist', 'openness'];
        let character = {};
        for (var i = 0; i < convertedAnswer.length; i++) {
            if (i === 0) {
                continue;
            }
            else{
                const cha = characterList[i - 1];
                character[cha] = convertedAnswer[i];
            }
        }
        let geneId = Utils.generateGeneId(answer);
        const characterTags = Utils.KMaxCharacter(character, 3);
        const index = Utils.geneToSeed(geneId.slice(8, 20));
        const tags = characterTags.map(charac => {
            const texts = Utils.characterReadable[charac]
            return texts[index % texts.length];
        });
        this.ctx.body = {
            character: character,
            geneId: geneId,
            characterTags: characterTags,
            index: index,
            tag: tags,
            rare: tags[2] in Utils.rare
        }
    }
}

module.exports = userController;
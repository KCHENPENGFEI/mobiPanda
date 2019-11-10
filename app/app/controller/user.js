'use strict';

const Controller = require('egg').Controller;
const Api = require('../api/api');
const Utils = require('../utils/utils');
const serviceConfig = require('../service/config');
const BN = require('bn.js');

var debug = true;

class userController extends Controller {
    async issue() {
        let start = new Date();
        let msg = this.ctx.request.body;
        let openid = msg.openid;                 // user's openid
        let EOSAccount = msg.EOSAccount;         // user's eos account
        let EOSPublicKey = msg.EOSPublicKey;     // usre's eos public key
        let answer = msg.answer;                 // user's answer
        
        try {
            // check if openid exist
            // if (!debug) {
            //     const result = await this.service.users.checkRegister(openid);
            //     if (result.code === -1) {
            //         const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            //         api.data.error = result.msg;
            //         this.ctx.body = api;
            //         return;
            //     }
            // }
            // // generate user's account
            // let time1 = new Date();
            // const signupResult = await this.ctx.service.eosService.createNewAccount(EOSAccount, EOSPublicKey);
            // // const signupResult = {code: 0};
            // let time2 = new Date();
            // console.log('create account: ', time2.getTime() - time1.getTime());
            // if (signupResult.code === -1) {
            //     // signup failed
            //     const api = JSON.parse(JSON.stringify(Api.signupFailedApi));
            //     api.data.error = signupResult.msg;
            //     this.ctx.body = api;
            //     return;
            // }

            // signup success
            // generate panda's gene
            // storage user's data
            let parseResult = await this.service.users.parseAnswer(answer);
            let geneId = parseResult.geneId;
            let character = parseResult.character;
            let tagsList = parseResult.tagsList;
            let geneIdMain = geneId.substring(0, 8);

            const insertResult = await this.service.users.insertUserInfo(openid, EOSAccount, EOSPublicKey, answer);
            if (!insertResult) {
                // database error
                const api = JSON.parse(JSON.stringify(Api.databaseErrorApi));
                api.data.error = '用户注册数据插入失败';
                this.ctx.body = api;
                return;
            }

            let time3 = new Date();
            const issueResult = await this.ctx.service.eosService.issuePanda(EOSAccount, serviceConfig.symbol, ['panda'], geneId);
            let time4 = new Date();
            console.log('issue panda: ', time4.getTime() - time3.getTime());

            if (issueResult.code === -1) {
                // issue failed
                const api = JSON.parse(JSON.stringify(Api.issuePandaFailedApi));
                api.data.error = issueResult.msg;
                this.ctx.body = api;
                return;
            }

            const firstIssueResult = await this.ctx.service.users.firstIssuePanda(openid, geneIdMain);
            if (!firstIssueResult) {
                // database error
                const api = JSON.parse(JSON.stringify(Api.databaseErrorApi));
                api.data.error = '熊猫基因数据插入失败';
                this.ctx.body = api;
                return;
            }

            // issue success
            // get panda info
            let time5 = new Date();
            const pandaTable = await this.ctx.service.eosService.checkPanda(EOSAccount);
            let time6 = new Date();
            console.log('check panda: ', time6.getTime() - time5.getTime());

            if (pandaTable.length === 0) {
                const api = JSON.parse(JSON.stringify(Api.checkPandaFailedApi));
                api.data.error = '不存在熊猫';
                this.ctx.body = api;
                return;
            }
            else if (pandaTable.length === 1) {
                const uuid = pandaTable[0].uuid;
                const createTime = pandaTable[0].createtime;
                const api = JSON.parse(JSON.stringify(Api.issuePandaSuccessApi));
                api.data.character = character;
                api.data.panda.uuid = uuid;
                api.data.panda.gene = geneId;
                api.data.panda.createTime = createTime;
                api.data.panda.tags = tagsList;

                let end = new Date();
                console.log('all cost: ', end.getTime() - start.getTime());
                this.ctx.body = api;
                await this.ctx.service.users.updatePandaQuantity(openid, 1, createTime);
                return;
            }
            else {
                // more than one panda
                const api = JSON.parse(JSON.stringify(Api.exceptionApi));
                api.data.error = '非第一次生成熊猫';
                this.ctx.body = api;
                return;
            }
        } catch (e) {
            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            api.data.error = e.message;
            this.ctx.body = api;
            return;
        }
    }

    async checkIssue() {
        var rankTable = {};
        if (debug) {
            rankTable = {
                "0": 0,
                "1": 0.5,
                "2": 0.5,
                "3": 0.5,
                "4": 0.5
            };
        }
        else {
            rankTable = {
                "0": 0,
                "1": 1,
                "2": 5,
                "3": 60,
                "4": 12 * 60
            };
        }
        let msg = this.ctx.query;
        let openid = msg.openid;
        try {
            const result = await this.service.users.quantityToTimestamp(rankTable, openid);
            if (result.code === -1) {
                // error
                const api = JSON.parse(JSON.stringify(Api.exceptionApi));
                api.data.error = result.msg;
                this.ctx.body = api;
                return;                
            }
            let timestamp = result.timestamp;
            let lastCreateTime = result.lastCreateTime;
            if (Date.parse(new Date()) / 1000 - lastCreateTime > timestamp) {
                // issue next panda
                const api = JSON.parse(JSON.stringify(Api.checkIssueSuccessApi));
                api.data.status = true;
                api.data.nextTime = -1;
                this.ctx.body = api;
                return;
            }
            else {
                var api = JSON.parse(JSON.stringify(Api.checkIssueSuccessApi));
                api.msg = 'wait for next time';
                api.data.status = false;
                api.data.nextTime = lastCreateTime + timestamp;
                this.ctx.body = api;
                return;
            }
        } catch (e) {
            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            api.data.error = e.message;
            this.ctx.body = api;
            return;
        }
    }

    async issueAgain() {
        var rankTable = {};
        if (debug) {
            rankTable = {
                "0": 0,
                "1": 0.5,
                "2": 0.5,
                "3": 0.5,
                "4": 0.5
            };
        }
        else {
            rankTable = {
                "0": 0,
                "1": 1,
                "2": 5,
                "3": 60,
                "4": 12 * 60
            };
        }
        let msg = this.ctx.request.body;
        let openid = msg.openid;
        try {
            const result = await this.service.users.quantityToTimestamp(rankTable, openid);
            if (result.code === -1) {
                // error
                const api = JSON.parse(JSON.stringify(Api.exceptionApi));
                api.data.error = result.msg;
                this.ctx.body = api;
                return;                
            }
            let timestamp = result.timestamp;
            let lastCreateTime = result.lastCreateTime;

            if (Date.parse(new Date()) / 1000 - lastCreateTime > timestamp) {
                const result = await this.service.users.randomParseAnswer(openid);
                if (result.code === -1) {
                    const api = JSON.parse(JSON.stringify(Api.issuePandaFailedApi));
                    api.data.error = result.msg;
                    this.ctx.body = api;
                    return;
                }
                const EOSAccount = result.EOSAccount;
                const geneId = result.geneId;
                const character = result.character;
                const tagsList = result.tagsList;

                // issue panda
                const issuePanda = await this.ctx.service.eosService.issuePanda(EOSAccount, serviceConfig.symbol, ['panda'], geneId);
                if (issuePanda.code === -1) {
                    // issue failed
                    const api = JSON.parse(JSON.stringify(Api.issuePandaFailedApi));
                    api.data.error = issuePanda.msg;
                    this.ctx.body = api;
                    return;
                }

                // issue success
                // check panda
                const pandaTable = await this.ctx.service.eosService.checkPanda(EOSAccount);
                if (pandaTable.length === 0) {
                    const api = JSON.parse(JSON.stringify(Api.checkPandaFailedApi));
                    api.data.error = '不存在熊猫';
                    this.ctx.body = api;
                    return;
                }
                else if (pandaTable.length === 1) {
                    const uuid = pandaTable[0].uuid;
                    const createTime = pandaTable[0].createtime;
                    const api = JSON.parse(JSON.stringify(Api.issuePandaAgainSuccessApi));
                    api.data.panda.uuid = uuid;
                    api.data.panda.gene = geneId;
                    api.data.panda.createTime = createTime;
                    api.data.panda.tags = tagsList;
                    this.ctx.body = api;
                    await this.ctx.service.users.increasePandaQuantity(openid, 1, createTime);
                    return;
                }
                else {
                    // more than one panda
                    for (var i = 0; i < pandaTable.length; i++) {
                        const pandaGene = pandaTable[i].gene;
                        if (pandaGene === geneId) {
                            break;
                        }
                    }
                    const uuid = pandaTable[i].uuid;
                    const createTime = pandaTable[i].createtime;
                    const api = JSON.parse(JSON.stringify(Api.issuePandaSuccessApi));
                    api.data.panda.uuid = uuid;
                    api.data.panda.gene = geneId;
                    api.data.panda.createTime = createTime;
                    api.data.panda.tags = tagsList;
                    this.ctx.body = api;
                    await this.ctx.service.users.increasePandaQuantity(openid, 1, createTime);
                    return;
                }
            }
            else {
                // issue failed
                const api = JSON.parse(JSON.stringify(Api.checkIssueSuccessApi));
                api.msg = 'wait for next time to create';
                api.data.status = false;
                api.data.nextTime = lastCreateTime + timestamp;
                this.ctx.body = api;
                return;
            }
        } catch (e) {
            const api = JSON.parse(JSON.stringify(Api.exceptionApi));
            api.data.error = e.message;
            this.ctx.body = api;
            return;
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
                        tagName: tags[k],
                        rare: tags[k] in Utils.rare
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
            let owner = getPandaResult[0].owner;
            let result = await this.service.users.checkAnswerByAccount(owner);
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
            const characterTags = Utils.KMaxCharacter(character, 3);
            const index = Utils.geneToSeed(gene.slice(8, 20));
            const tags = characterTags.map(charac => {
                const texts = Utils.characterReadable[charac]
                return texts[index % texts.length];
            });
            let createTime = getPandaResult[0].createtime;
            const api = JSON.parse(JSON.stringify(Api.getPandaSuccessApi));
            api.data.character = character;
            api.data.panda.uuid = uuid;
            api.data.panda.gene = gene;
            api.data.panda.createTime = createTime;
            let tagsList = [];
            for (let k = 0; k < tags.length; k++) {
                let tag = {
                    tagName: tags[k],
                    rare: tags[k] in Utils.rare
                };
                tagsList.push(tag);
            }
            api.data.panda.tags = tagsList;
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
                api.data.error = '发送账户不存在';
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
'use strict';

const Service = require('egg').Service;
const Utils = require('../utils/utils');
const cache = require('../service/lruCache').cache;

const table = 'tb_pandas';
const inBoxesTable = 'tb_inBoxes';
const transferInfoTable = 'tb_transferInfo';

class userService extends Service {
    async loginAndRegister(openid) {
        // check cache first
        let EOSAccount = cache.get(openid);
        if (EOSAccount !== undefined) {
            return {EOSAccount};
        }
        const loginResult = await this.app.mysql.get(table, {openid: openid});
        if (loginResult === null) {
            // do register
            const registerResult = await this.app.mysql.insert(table, {openid: openid});
            const insertSuccess = registerResult.affectedRows === 1;
            if (insertSuccess) {
                // insert into cache
                cache.set(openid, '');
                return {EOSAccount: '', openid: openid};
            }
            else {
                return {};
            }
        }
        else {
            // insert into cache
            cache.set(openid, loginResult.EOSAccount);
            return loginResult;
        }
    }

    async checkRegister(openid) {
        const account = await this.checkEOSAccount(openid);
        if (account.length !== 0) {
            if (account[0].EOSAccount !== null) {
                return {
                    code: 0
                };
            }
            else {
                return {
                    code: -1,
                    msg: '重复注册eos账号'
                };
            }
        }
        else {
            return {
                code: -1,
                msg: '您还未授权登陆'
            };
        }
    }

    async parseAnswer(answer) {
        let convertedAnswer = Utils.answerConvert(answer);
        let characterList = ['controller', 'burst', 'loneliness', 'buddhist', 'openness'];
        let character = {};
        // gennerate character
        for (let i = 0; i < convertedAnswer.length; i++) {
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
        const seed = Utils.geneToSeed(geneId.slice(8, 20));
        let index = [];
        for (let i = 0; i < 3; i++) {
            index.push(Math.floor(parseInt(seed[i], 16) / 2));
        }
        const tags = characterTags.map((charac, k) => {
            const texts = Utils.characterReadable[charac];
            return texts[index[k]];
        });
        let tagsList = [];
        for (let k = 0; k < tags.length; k++) {
            let tag = {
                tagName: tags[k],
                rare: tags[k] in Utils.rare
            };
            tagsList.push(tag);
        }
        return {
            geneId: geneId,
            character: character,
            tagsList: tagsList
        };
    }

    async randomParseAnswer(openid) {
        const resultList = await this.checkPandaAccountAndAnswer(openid);
        if (resultList.length === 0) {
            return {
                code: -1,
                msg: '未查找到用户'
            };
        }
        const EOSAccount = resultList[0].EOSAccount;
        const answerStr = resultList[0].answer;
        const answerList = answerStr.split(',');
        let answer = [];
        answer = answerList.map(item => {
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
        const seed = Utils.geneToSeed(geneId.slice(8, 20));
        let index = [];
        for (let i = 0; i < 3; i++) {
            index.push(Math.floor(parseInt(seed[i], 16) / 2));
        }
        const tags = characterTags.map((charac, k) => {
            const texts = Utils.characterReadable[charac];
            return texts[index[k]];
        });
        let tagsList = [];
        for (let k = 0; k < tags.length; k++) {
            let tag = {
                tagName: tags[k],
                rare: tags[k] in Utils.rare
            };
            tagsList.push(tag);
        }
        return {
            EOSAccount: EOSAccount,
            geneId: geneId,
            character: character,
            tagsList: tagsList
        };
    }

    async answer2Cha(answer) {
        let convertedAnswer = Utils.answerConvert(answer);
        let characterList = ['controller', 'burst', 'loneliness', 'buddhist', 'openness'];
        let character = {};
        for (var i = 0; i < convertedAnswer.length; i++) {
            if (i === 0) {
                continue;
            }
            else {
                const cha = characterList[i - 1];
                character[cha] = convertedAnswer[i];
            }
        }
        return character;
    }

    async genTags(character, geneId) {
        const characterTags = Utils.KMaxCharacter(character, 3);
        const seed = Utils.geneToSeed(geneId.slice(8, 20));
        let index = [];
        for (let i = 0; i < 3; i++) {
            index.push(Math.floor(parseInt(seed[i], 16) / 2));
        }
        const tags = characterTags.map((charac, k) => {
            const texts = Utils.characterReadable[charac];
            return texts[index[k]];
        });
        let tagsList = [];
        for (let k = 0; k < tags.length; k++) {
            let tag = {
                tagName: tags[k],
                rare: tags[k] in Utils.rare
            };
            tagsList.push(tag);
        }
        return tagsList;
    }

    async quantityToTimestamp(rankTb, openid) {
        const quaResult = await this.checkPandaQuantity(openid);
        if (quaResult.length === 0) {
            // check failed
            return {
                code: -1,
                msg: '熊猫数量为0'
            };
        }
        let timestamp = 0;
        const pandaQuantity = quaResult[0].pandaQuantity;
        const lastCreateTime = quaResult[0].lastCreateTime;
        if (lastCreateTime === null) {
            lastCreateTime = Date.parse(new Date()) / 1000;
        }
        if (pandaQuantity >= 4) {
            timestamp = rankTb[4] * 60;
        }
        else {
            timestamp = rankTb[pandaQuantity] * 60;
        }
        return {
            code: 0,
            msg: '',
            lastCreateTime: lastCreateTime,
            timestamp: timestamp
        };
    }

    async insertUserInfo(openid, EOSAccount, EOSPublicKey, answer) {
        // insert into cache
        cache.set(openid, EOSAccount);
        
        const row = {
            EOSAccount: EOSAccount,
            EOSPublicKey: EOSPublicKey,
            answer: answer
        };

        const option = {
            where: {
                openid: openid
            }
        };

        const insertResult = await this.app.mysql.update(table, row, option);
        const returnResult = insertResult.affectedRows === 1;
        return returnResult;
    }

    async firstIssuePanda(openid, genePart) {
        const row = {
            pandaQuantity: 0,
            genePart: genePart
        };

        const option = {
            where: {
                openid: openid
            }
        };

        const issueResult = await this.app.mysql.update(table, row, option);
        const returnResult = issueResult.affectedRows === 1;
        return returnResult;
    }

    async updatePandaQuantity(openid, quantity, time) {
        const row = {
            pandaQuantity: quantity,
            lastCreateTime: time
        };

        const option = {
            where: {
                openid: openid
            }
        };

        const updateResult = await this.app.mysql.update(table, row, option);
        const returnResult = updateResult.affectedRows === 1;
        return returnResult;
    }

    async checkAnswerByUuid(uuid) {
        const checkResult = await this.app.mysql.get(inBoxesTable, { uuid: uuid });
        return checkResult;
    }

    async increasePandaQuantity(openid, quantity, time) {
        const result = await this.app.mysql.query('update tb_pandas set pandaQuantity = (pandaQuantity + ?), lastCreateTime = ? where openid = ?', [quantity, time, openid]);
        const returnResult = result.affectedRows === 1;
        return returnResult;
    }

    async checkPandaQuantity(openid) {
        const checkResult = await this.app.mysql.select(table, {
            where: {openid: openid},
            columns: ['pandaQuantity', 'lastCreateTime']
        });
        return checkResult;
    }

    async checkPandaAccountAndAnswer(openid) {
        const checkResult = await this.app.mysql.select(table, {
            where: {openid: openid},
            columns: ['EOSAccount', 'answer']
        });
        return checkResult;
    }

    async checkEOSAccount(openid) {
        const checkResult = await this.app.mysql.select(table, {
            where: {openid: openid},
            columns: ['EOSAccount']
        });
        return checkResult;
    }

    async checkOpenId(EOSAccount) {
        const checkResult = await this.app.mysql.select(table, {
            where: {EOSAccount: EOSAccount},
            columns: ['openid']
        });
        return checkResult;
    }

    async checkInBoxes(receiverEOSAccount) {
        const checkResult = await this.app.mysql.select(inBoxesTable, {
            where: {receiverEOSAccount: receiverEOSAccount},
            columns: ['senderEOSAccount', 'uuid', 'answer']
        });
        return checkResult;
    }

    async saveInBoxes(receiverEOSAccount, senderEOSAccount, uuid, answer) {
        const insertResult = await this.app.mysql.insert(inBoxesTable, {
            receiverEOSAccount: receiverEOSAccount,
            senderEOSAccount: senderEOSAccount,
            uuid: uuid,
            answer: answer
        });
        const insertSuccess = insertResult.affectedRows === 1;
        return insertSuccess;
    }

    async deleteInBoxes(receiverEOSAccount, senderEOSAccount, uuid) {
        const deleteResult = await this.app.mysql.delete(inBoxesTable, {
            uuid: uuid,
            receiverEOSAccount: senderEOSAccount,
            senderEOSAccount: receiverEOSAccount
        });
        const deleteSuccess = deleteResult.affectedRows === 1;
        return deleteSuccess;
    }

    async checkAnswerByAccount(EOSAccount) {
        const checkResult = await this.app.mysql.get(table, { EOSAccount: EOSAccount });
        return checkResult;
    }

    async upgradeTansferInfo(symbol) {
        const result = await this.app.mysql.query('update tb_transferInfo set record = (record + 1) where symbol = ?', [symbol]);
        const returnResult = result.affectedRows === 1;
        return returnResult;
    }

    async test(uid) {
        // const db = this.app.mysql.get('testDB');
        const user = await this.app.mysql.get(table, { ID: 1 });
        return {user};
    }
}

module.exports = userService;
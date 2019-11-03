const Service = require('egg').Service;

const table = 'tb_pandas';
const inBoxesTable = 'tb_inBoxes';

class userService extends Service {
    async login(openid) {
        const loginResult = await this.app.mysql.get(table, { openid: openid });
        return loginResult;
    }

    async register(openid) {
        const registerResult = await this.app.mysql.insert(table, {openid: openid});
        const insertSuccess = registerResult.affectedRows === 1;
        return insertSuccess;
    }

    async firstIssuePanda(openid, EOSAccount, EOSPublicKey, answer, genePart) {
        const row = {
            EOSAccount: EOSAccount,
            EOSPublicKey: EOSPublicKey,
            answer: answer,
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

    async checkAnswerByAccount(EOSAccount) {
        const checkResult = await this.app.mysql.get(table, { EOSAccount: EOSAccount });
        return checkResult;
    }

    async test(uid) {
        // const db = this.app.mysql.get('testDB');
        const user = await this.app.mysql.get(table, { ID: 1 });
        return {user};
    }
}

module.exports = userService;
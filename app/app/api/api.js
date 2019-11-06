const commonSuccessApi = {
    code: 0,
    msg: 'operation success',
    data: {}
};

const commonFailedApi = {
    code: -1,
    msg: 'operation failed',
    data: {}
};

const signupFailedApi = {
    code: -1,
    msg: 'signup failed',
    data: {error: ''}
};

const loginFailedApi = {
    code: -1,
    msg: 'login failed',
    data: {error: ''}
};

const loginSucccessApi = {
    code: 0,
    msg: 'login success',
    data: {
        openid: '',
        nickname: '',
        headimgurl: '',
        EOSAccount: ''
    }
};

const databaseErrorApi = {
    code: -1,
    msg: 'database error',
    data: {error: ''}
};

const exceptionApi = {
    code: -2,
    msg: 'exception',
    data: {error: ''}
};

const issuePandaSuccessApi = {
    code: 0,
    msg: 'issue panda success',
    data: {
        character: {
            controller: 0.,
            burst: 0.,
            loneliness: 0.,
            buddhist: 0.,
            openness: 0.
        },
        panda: {
            gene: '',
            uuid: '',
            createTime: null
        }
    }
};

const issuePandaAgainSuccessApi = {
    code: 0,
    msg: 'issue panda success',
    data: {
        panda: {}
    }
};

const issuePandaFailedApi = {
    code: -1,
    msg: 'issue panda failed',
    data: {
        error: ''
    }
};

const checkPandaFailedApi = {
    code: -1,
    msg: 'checkPandaFailed',
    data: {
        error: ''
    }
};

var checkIssueSuccessApi = {
    code: 0,
    msg: 'check issue success',
    data: {
        status: false,
        nextTime: -1
    }
};

const pandaListSuccessApi = {
    code: 0,
    msg: 'get pandas success',
    data: {
        status: true,
        pandaList: []
    }
};

const getPandaSuccessApi = {
    code: 0,
    msg: 'get panda success',
    data: {
        panda: {
            gene: '',
            uuid: '',
            createTime: null
        }
    }
}

const getCharacterSuccessApi = {
    code: 0,
    msg: 'get character success',
    data: {
        character: {
            controller: 0.,
            burst: 0.,
            loneliness: 0.,
            buddhist: 0.,
            openness: 0.
        }
    }
}

const getInBoxesSuccessApi = {
    code: 0,
    msg: 'get inBoxes success',
    data: {
        inBoxes: []
    }
};

const getSignSuccessApi = {
    code: 0,
    msg: 'get signature success',
    data: {
        nonceStr: '',
        timestamp: null,
        signature: ''
    }
};

const getSignFailedApi = {
    code: -1,
    msg: 'get signature failed',
    data: {
        error: ''
    }
};

const httpErrorApi = {
    code: -1,
    msg: 'http/https error',
    data: {error: ''}
}

// exports.commonApi;
// exports.signupFailedApi;

module.exports = {
    commonSuccessApi,
    commonFailedApi,
    signupFailedApi,
    loginFailedApi,
    loginSucccessApi,
    databaseErrorApi,
    exceptionApi,
    issuePandaSuccessApi,
    issuePandaAgainSuccessApi,
    issuePandaFailedApi,
    checkPandaFailedApi,
    checkIssueSuccessApi,
    pandaListSuccessApi,
    getPandaSuccessApi,
    getCharacterSuccessApi,
    getInBoxesSuccessApi,
    getSignSuccessApi,
    getSignFailedApi,
    httpErrorApi
}
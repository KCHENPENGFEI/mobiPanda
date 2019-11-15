const sha1 = require('js-sha1');

const characterIndex = {
    controllerIndex: [2.5, 5, 3, 3.5],
    burstIndex: [5, 4, 3, 2],
    lonelinessIndex: [4, 1, 5, 2],
    buddhistIndex: [5, 3.5, 4, 1],
    opennessIndex: [5, 4, 2, 3]
}

const characterGene = {
    common: '0000',
    controller: '0001',
    burst: '0002',
    loneliness: '0003',
    buddhist: '0004',
    openness: '0005'
}

const gene3 = '00000000';

// character tag
const characterReadable = {
    controller: [
        '运筹帷幄',
        '在世诸葛',
        '钢铁侠',
        '小当家',
        '灭霸',
        '掌控者',
        '傀儡师',
        '王子'
    ],
    burst: [
        '魔鬼辣椒',
        '火山少女',
        '暴躁老哥',
        '博尔特',
        '天使魔鬼',
        '窜天熊',
        '胖虎',
        '宫本武藏'
    ],
    loneliness: [
        '孤独患者',
        '寂寞先生',
        '睡莲',
        '葫芦娃',
        '旅行青蛙',
        '布偶猫',
        '键盘侠',
        '老人与海'
    ],
    buddhist: [
        '佛系青年',
        '心如止水',
        '听天由命',
        '卡比兽',
        '铁憨憨',
        '树懒',
        '可达鸭',
        '唐三藏'
    ],
    openness: [
        '中本聪',
        '天马行空',
        '暴风少年',
        '小天才',
        '拓荒者',
        '多啦A梦',
        '柯南',
        '狄仁杰'
    ]
}

const rare = {
    '可达鸭': 1,
    '中本聪': 1,
    '鲨鱼辣椒': 1,
    '钢铁侠': 1,
    '葫芦娃': 1
}

var answerConvert = (answer) => {
    converted = [];
    valueList = [];
    for (var key in characterIndex) {
        valueList.push(characterIndex[key]);
    }
    for (let i = 0; i < answer.length; i++) {
        if (i === 0) {
            // continue;
            converted.push(answer[i]);
        }
        else {
            converted.push(valueList[i - 1][answer[i]]);
        }
    }
    return converted;
};

var parseCharacter = (character) => {
    // console.log(character);
    let specificGene = '';
    geneList = [];
    for (var key in characterGene) {
        geneList.push(characterGene[key]);
    }
    let max = 0;
    let maxIndex = 0;
    for (var i = 0; i < character.length; i++) {
        if (character[i] > max) {
            max = character[i];
            maxIndex = i;
        }
    }
    if (character[0] === 1) {
        specificGene += '0001';
    }
    else {
        specificGene += '0000';
    }
    if (max > 3) {
        specificGene += geneList[maxIndex];
    }
    else {
        specificGene += geneList[0];
    }
    return specificGene;
};

var generateRandomPartGeneId = (len) => {
    let randomGeneId = '';
    arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    for (var i = 0; i < len; i++) {
        let randomId = Math.round(Math.random() * (arr.length - 1));
        randomGeneId += arr[randomId];
    }
    return randomGeneId;
};

var generateGeneId = (answer) => {
    let answerConverted = answerConvert(answer);
    let gene1 = parseCharacter(answerConverted);
    let gene2 = generateRandomPartGeneId(16);
    return gene1 + gene2 + gene3;
};

var generateRandomMainGeneId = (genderId) => {
    let randomMainGeneId = genderId;
    let arr = ['0000', '0001', '0002', '0003', '0004', '0005'];
    let randomId = Math.round(Math.random() * (arr.length - 1));
    randomMainGeneId += arr[randomId];
    return randomMainGeneId;
};

var generateRandomGeneId = (genderId) => {
    let mainGeneId = generateRandomMainGeneId(genderId);
    let partGeneId = generateRandomPartGeneId(16);
    return mainGeneId + partGeneId + gene3;
};

var geneToSeed = (gene) => {
    return sha1(gene);
}

var KMaxCharacter = (character, k) => {
    let index = [].concat(new Array(k).fill(-1));
    let keys = [];
    // index.fill(-1);
    for (let key in character) {
        for (let i = 0; i < k; i++) {
            if (character[key] > index[i]) {
                for (let j = k - 1; j > i; j--) {
                    index[j] = index[j - 1];
                    keys[j] = keys[j - 1];
                }
                index[i] = character[key]
                keys[i] = key;
                break;
            }
        }
    }
    return keys;
}

var sleep = (time)=>(new Promise((resolve)=>{
    setTimeout(()=>{
        resolve();
    },time);
}))


module.exports = {
    characterReadable,
    rare,
    answerConvert,
    generateGeneId,
    generateRandomPartGeneId,
    generateRandomGeneId,
    geneToSeed,
    KMaxCharacter,
    sleep
}
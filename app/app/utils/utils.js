
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

module.exports = {
    answerConvert,
    generateGeneId,
    generateRandomGeneId
}
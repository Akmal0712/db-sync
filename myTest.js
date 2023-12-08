const crypto = require('crypto');

// function hashStringToPseudoRandom(inputString) {
//     const hash = crypto.createHash('sha256');
//     hash.update(inputString);
//     const hashedString = hash.digest('hex');
//     return hashedString.substr(0, 8);
// }
//
// // Пример использования
// const inputString = 'someSecretValue';
// const pseudoRandomResult = hashStringToPseudoRandom(inputString);
// console.log(pseudoRandomResult);


let count = 0;
setInterval(() => {
    count++;
    if (count === 3) return;
    console.log("interval")
}, 1000);
const pattern = /(["'])((?:\\\1|(?:(?!\1|\n|\r).)*)*)\1/;
const newPattern = new RegExp('^(?:' + pattern.source + ')');
const input = '"vue"'
// token正则匹配
const matchRes = input.match(pattern); // 尝试匹配输入字符串
console.log(matchRes)

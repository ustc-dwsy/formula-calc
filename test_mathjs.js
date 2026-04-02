const { parse } = require('mathjs');
console.log("pi ->", parse("pi").toTex());
console.log("pi * r^2 ->", parse("pi * r^2").toTex());
console.log("m / (pi * r^2) ->", parse("m / (pi * r^2)").toTex());
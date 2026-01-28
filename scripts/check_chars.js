const fs = require('fs');
const p = 'src/app/inventario/retiros/nuevo/page.tsx';
const s = fs.readFileSync(p,'utf8');
const lines = s.split(/\r?\n/);
const i = 331; // 1-based index 332 line
console.log('LINE', i+1, lines[i]);
for(let j=0;j<lines[i].length;j++){const c=lines[i].charCodeAt(j);if(c<32||c>126)console.log(j,'char',JSON.stringify(lines[i][j]),'code',c);}
console.log('NEXT', i+2, lines[i+1]);
for(let j=0;j<lines[i+1].length;j++){const c=lines[i+1].charCodeAt(j);if(c<32||c>126)console.log(j,'char',JSON.stringify(lines[i+1][j]),'code',c);}
const backticks = (s.match(/`/g) || []).length;
const parensOpen = (s.match(/\(/g) || []).length;
const parensClose = (s.match(/\)/g) || []).length;
console.log('backticks', backticks, 'parens', parensOpen, parensClose);
const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '다가구주택 매매목록표.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
for(let i=0; i<Math.min(20, data.length); i++) {
  console.log(`Row ${i}:`, data[i]);
}

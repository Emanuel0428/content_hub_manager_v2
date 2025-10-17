const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const DB_PATH = path.join(__dirname, '..', 'db', 'dev.sqlite');
fs.mkdirSync(path.dirname(DB_PATH), {recursive:true});
const db = new sqlite3.Database(DB_PATH);
const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'sqlite-schema.sql'), 'utf8');

db.exec(schema, (err)=>{
  if(err) return console.error('migrate error', err);
  console.log('migration applied');
  db.close();
});

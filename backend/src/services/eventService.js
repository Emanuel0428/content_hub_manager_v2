const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const DB_PATH = path.join(__dirname, '..', '..', 'db', 'dev.sqlite');
fs.mkdirSync(path.dirname(DB_PATH), {recursive:true});
const db = new sqlite3.Database(DB_PATH);

module.exports = {
  emit: function(type, payload){
    const p = JSON.stringify(payload || {})
    db.run('INSERT INTO events (type, payload) VALUES (?,?)', [type, p], (err)=>{
      if(err) console.error('event write failed', err)
    })
  }
}

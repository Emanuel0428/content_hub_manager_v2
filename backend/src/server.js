const path = require('path');
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');
const fs = require('fs');
const sqlite3 = require('sqlite3');

const app = Fastify({logger:true});
app.register(cors, {origin: true});

const DB_PATH = path.join(__dirname, '..', 'db', 'dev.sqlite');
fs.mkdirSync(path.dirname(DB_PATH), {recursive:true});
const db = new sqlite3.Database(DB_PATH);
const eventService = require('./services/eventService')
const mapError = require('./utils/errorMapper')
const multipart = require('@fastify/multipart')
const { registerObservability, logError } = require('./middleware/observability')
const { registerAuth } = require('./middleware/auth')

app.register(multipart)

// Register observability (logging & metrics)
registerObservability(app)

// Register auth middleware (disabled by default for dev)
registerAuth(app, { enableAuth: process.env.ENABLE_AUTH === 'true' })

// Simple migration: create tables if not exist
const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'sqlite-schema.sql'), 'utf8');
db.exec(schema);

app.get('/api/health', async ()=>({ok:true}));

app.get('/api/assets', (req, reply) => {
  db.all('SELECT a.id, a.title, a.platform, v.id as version_id, v.path as version_path FROM assets a LEFT JOIN asset_versions v ON v.asset_id = a.id GROUP BY a.id', [], (err, rows)=>{
    if(err) return reply.status(500).send({error: 'db_error'});
    reply.send({data: rows});
  });
});

app.get('/api/assets/:id', (req, reply)=>{
  const id = req.params.id
  db.get('SELECT id, title, platform, created_at FROM assets WHERE id = ?', [id], (err, asset)=>{
    if(err) return reply.status(500).send({error:'db_error'})
    if(!asset) return reply.status(404).send({error:'not_found'})
    db.all('SELECT id, path, created_at FROM asset_versions WHERE asset_id = ? ORDER BY created_at DESC', [id], (err2, versions)=>{
      if(err2) return reply.status(500).send({error:'db_error'})
      asset.versions = versions || []
      reply.send({data: asset})
    })
  })
})

app.get('/api/events', (req, reply)=>{
  db.all('SELECT id, type, payload, created_at FROM events ORDER BY id DESC LIMIT 200', [], (err, rows)=>{
    if(err) return reply.status(500).send({error:'db_error'})
    reply.send({data: rows})
  })
})

app.post('/api/assets', (req, reply)=>{
  // minimal: accept title, platform, path
  const {title, platform, path: assetPath} = req.body || {};
  if(!title || !platform || !assetPath) return reply.status(400).send({error:'missing_fields'});
  db.run('INSERT INTO assets (title, platform) VALUES (?,?)', [title, platform], function(err){
    if(err){
      const mapped = mapError(err)
      return reply.status(mapped.status||500).send({error:mapped.message});
    }
    const assetId = this.lastID;
    db.run('INSERT INTO asset_versions (asset_id, path) VALUES (?,?)', [assetId, assetPath], function(err2){
      if(err2){
        const mapped = mapError(err2)
        return reply.status(mapped.status||500).send({error:mapped.message});
      }
      // emit event
      eventService.emit('asset.created', {assetId, title, platform, path: assetPath})
      reply.send({id: assetId});
    });
  });
});

// Move asset to folder (T022)
app.put('/api/assets/:id/move', (req, reply)=>{
  const assetId = req.params.id
  const {folder_id} = req.body || {}
  db.run('UPDATE assets SET folder_id = ? WHERE id = ?', [folder_id || null, assetId], function(err){
    if(err){
      const mapped = mapError(err)
      return reply.status(mapped.status||500).send({error:mapped.message})
    }
    reply.send({ok: true})
    eventService.emit('asset.moved', {assetId, folder_id})
  })
})

// Simple multipart upload endpoint for demo
app.post('/api/upload', async (req, reply)=>{
  try{
    const parts = req.parts()
    for await (const part of parts){
      if(part.file){
        const filename = part.filename || 'upload.bin'
        const outPath = path.join(__dirname, '..', 'public', 'uploads', filename)
        await fs.promises.mkdir(path.dirname(outPath), {recursive:true})
        const ws = fs.createWriteStream(outPath)
        await new Promise((res, rej)=>{
          part.file.pipe(ws)
          part.file.on('end', res)
          part.file.on('error', rej)
        })
        // emit event
        eventService.emit('upload.completed', {filename, path: '/public/uploads/'+filename})
        return reply.send({path: '/public/uploads/'+filename})
      }
    }
    return reply.status(400).send({error:'no_file'})
  }catch(err){
    const mapped = mapError(err)
    return reply.status(mapped.status||500).send({error:mapped.message})
  }
})

// Simple search endpoint using FTS virtual table if exists
app.get('/api/search', (req, reply)=>{
  const q = req.query.q || '';
  if(!q) return reply.send({data: []});
  db.all("SELECT a.id, a.title FROM assets_fts f JOIN assets a ON a.id = f.rowid WHERE assets_fts MATCH ? LIMIT 50", [q], (err, rows)=>{
    if(err){
      // fallback to LIKE
      db.all('SELECT id, title FROM assets WHERE title LIKE ? LIMIT 50', [`%${q}%`], (err2, rows2)=>{
        if(err2){
          const mapped = mapError(err2)
          return reply.status(mapped.status||500).send({error:mapped.message})
        }
        reply.send({data: rows2});
      });
      return;
    }
    reply.send({data: rows});
  });
});

// ===== FOLDERS (T020) =====
app.get('/api/folders', (req, reply)=>{
  db.all('SELECT id, name, created_at FROM folders ORDER BY name ASC', [], (err, rows)=>{
    if(err) return reply.status(500).send({error:'db_error'})
    reply.send({data: rows})
  })
})

app.post('/api/folders', (req, reply)=>{
  const {name} = req.body || {}
  if(!name) return reply.status(400).send({error:'missing_name'})
  db.run('INSERT INTO folders (name) VALUES (?)', [name], function(err){
    if(err){
      const mapped = mapError(err)
      return reply.status(mapped.status||500).send({error:mapped.message})
    }
    reply.send({id: this.lastID})
    eventService.emit('folder.created', {folderId: this.lastID, name})
  })
})

app.get('/api/folders/:id', (req, reply)=>{
  const id = req.params.id
  db.get('SELECT id, name, created_at FROM folders WHERE id = ?', [id], (err, folder)=>{
    if(err) return reply.status(500).send({error:'db_error'})
    if(!folder) return reply.status(404).send({error:'not_found'})
    // get assets in folder
    db.all('SELECT id, title, platform FROM assets WHERE folder_id = ?', [id], (err2, assets)=>{
      if(err2) return reply.status(500).send({error:'db_error'})
      folder.assets = assets || []
      reply.send({data: folder})
    })
  })
})

app.delete('/api/folders/:id', (req, reply)=>{
  const id = req.params.id
  db.run('DELETE FROM folders WHERE id = ?', [id], function(err){
    if(err){
      const mapped = mapError(err)
      return reply.status(mapped.status||500).send({error:mapped.message})
    }
    reply.send({ok: true})
    eventService.emit('folder.deleted', {folderId: id})
  })
})

app.put('/api/folders/:id', (req, reply)=>{
  const id = req.params.id
  const {name} = req.body || {}
  if(!name) return reply.status(400).send({error:'missing_name'})
  db.run('UPDATE folders SET name = ? WHERE id = ?', [name, id], (err)=>{
    if(err){
      const mapped = mapError(err)
      return reply.status(mapped.status||500).send({error:mapped.message})
    }
    reply.send({ok: true})
    eventService.emit('folder.updated', {folderId: id, name})
  })
})

// ===== CHECKLISTS (T023) =====
app.get('/api/checklists/:assetId', (req, reply)=>{
  const assetId = req.params.assetId
  // Get asset to determine platform
  db.get('SELECT platform FROM assets WHERE id = ?', [assetId], (err, asset)=>{
    if(err) return reply.status(500).send({error:'db_error'})
    if(!asset) return reply.status(404).send({error:'not_found'})
    
    // Load platform-specific checklist template
    const items = getPlatformChecklist(asset.platform)
    
    // Get existing checklist state from DB
    db.all('SELECT id, item_key, completed FROM checklists WHERE asset_id = ?', [assetId], (err2, completed)=>{
      if(err2) return reply.status(500).send({error:'db_error'})
      const completedMap = new Map(completed.map(c=>([c.item_key, c])))
      
      const result = items.map(item=>({
        key: item,
        label: item.replace(/_/g, ' ').toUpperCase(),
        completed: completedMap.has(item) && completedMap.get(item).completed
      }))
      
      reply.send({data: {assetId, platform: asset.platform, items: result}})
    })
  })
})

app.post('/api/checklists/:assetId/mark', (req, reply)=>{
  const assetId = req.params.assetId
  const {item_key, completed} = req.body || {}
  if(!item_key) return reply.status(400).send({error:'missing_item_key'})
  
  db.run('INSERT OR REPLACE INTO checklists (asset_id, item_key, completed) VALUES (?,?,?)', 
    [assetId, item_key, completed ? 1 : 0], (err)=>{
    if(err){
      const mapped = mapError(err)
      return reply.status(mapped.status||500).send({error:mapped.message})
    }
    reply.send({ok: true})
    eventService.emit('checklist.updated', {assetId, item_key, completed})
  })
})

function getPlatformChecklist(platform){
  const checklists = {
    'twitch': ['stream_title', 'category_tagged', 'clips_enabled', 'thumbnail_uploaded'],
    'tiktok': ['sound_selected', 'hashtags_added', 'description_complete', 'aspect_ratio_ok'],
    'youtube': ['title_optimized', 'description_seo', 'thumbnail_custom', 'tags_added'],
    'instagram': ['caption_written', 'hashtags_added', 'alt_text_added', 'location_tagged'],
    'demo': ['title_set', 'platform_selected', 'preview_ready', 'checklist_complete']
  }
  return checklists[platform] || checklists['demo']
}

// serve uploaded files for demo from public/uploads
app.register(fastifyStatic, { root: path.join(__dirname, '..', 'public'), prefix: '/public/' });

const start = async ()=>{
  try{
    await app.listen({port: 3001, host:'0.0.0.0'});
    console.log('Backend listening on 3001');
  }catch(e){
    app.log.error(e);
    process.exit(1);
  }
};
start();

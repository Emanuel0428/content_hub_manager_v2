/**
 * Base Repository
 * Provides common database operations with promise-based API
 */

class BaseRepository {
  constructor(db, tableName) {
    this.db = db
    this.tableName = tableName
  }

  /**
   * Execute a query and return all results
   */
  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  /**
   * Execute a query and return a single result
   */
  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  }

  /**
   * Execute a query that modifies data (INSERT, UPDATE, DELETE)
   */
  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) reject(err)
        else resolve({ 
          lastID: this.lastID, 
          changes: this.changes 
        })
      })
    })
  }

  /**
   * Find all records
   */
  async findAll(conditions = {}, orderBy = 'id DESC') {
    const { where, params } = this._buildWhere(conditions)
    const query = `SELECT * FROM ${this.tableName} ${where} ORDER BY ${orderBy}`
    return this.all(query, params)
  }

  /**
   * Find a single record by ID
   */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`
    return this.get(query, [id])
  }

  /**
   * Create a new record
   */
  async create(data) {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map(() => '?').join(', ')
    
    const query = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`
    const result = await this.run(query, values)
    return result.lastID
  }

  /**
   * Update a record by ID
   */
  async update(id, data) {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const setClause = keys.map(key => `${key} = ?`).join(', ')
    
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`
    const result = await this.run(query, [...values, id])
    return result.changes
  }

  /**
   * Delete a record by ID
   */
  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`
    const result = await this.run(query, [id])
    return result.changes
  }

  /**
   * Build WHERE clause from conditions object
   */
  _buildWhere(conditions) {
    const keys = Object.keys(conditions)
    if (keys.length === 0) {
      return { where: '', params: [] }
    }

    const clauses = keys.map(key => {
      if (conditions[key] === null) {
        return `${key} IS NULL`
      }
      return `${key} = ?`
    })

    const params = keys
      .filter(key => conditions[key] !== null)
      .map(key => conditions[key])

    return {
      where: `WHERE ${clauses.join(' AND ')}`,
      params
    }
  }
}

module.exports = BaseRepository

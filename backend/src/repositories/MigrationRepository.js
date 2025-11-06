const BaseRepository = require('./BaseRepository');

/**
 * Repository for managing migration job records
 * Tracks migration progress, status, and statistics
 */
class MigrationRepository extends BaseRepository {
  
  /**
   * Create a new migration job record
   * @param {Object} jobData - Migration job data
   * @param {string} jobData.job_id - Unique job identifier
   * @param {string} jobData.status - Job status (pending, running, completed, failed)
   * @param {number} jobData.total_assets - Total number of assets to migrate
   * @param {Object} jobData.metadata - Additional metadata as JSON
   * @returns {Promise<Object>} Created job record
   */
  async createJob(jobData) {
    const {
      job_id,
      status = 'pending',
      total_assets = 0,
      metadata = {}
    } = jobData;

    const sql = `
      INSERT INTO migration_jobs (
        job_id, status, total_assets, metadata, started_at, created_at
      ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `;

    const result = await this.run(sql, [
      job_id,
      status,
      total_assets,
      JSON.stringify(metadata)
    ]);

    return this.getJobById(job_id);
  }

  /**
   * Get migration job by ID
   * @param {string} jobId - Job identifier
   * @returns {Promise<Object|null>} Job record or null if not found
   */
  async getJobById(jobId) {
    const sql = `
      SELECT 
        id,
        job_id,
        status,
        total_assets,
        processed_assets,
        failed_assets,
        error_log,
        metadata,
        started_at,
        completed_at,
        created_at
      FROM migration_jobs 
      WHERE job_id = ?
    `;

    const job = await this.get(sql, [jobId]);
    
    if (job && job.metadata) {
      try {
        job.metadata = JSON.parse(job.metadata);
      } catch (e) {
        job.metadata = {};
      }
    }

    return job;
  }

  /**
   * Update migration job progress
   * @param {string} jobId - Job identifier
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated job record
   */
  async updateJobProgress(jobId, updates) {
    const {
      status,
      processed_assets,
      failed_assets,
      error_log,
      metadata
    } = updates;

    const setParts = [];
    const values = [];

    if (status !== undefined) {
      setParts.push('status = ?');
      values.push(status);
    }

    if (processed_assets !== undefined) {
      setParts.push('processed_assets = ?');
      values.push(processed_assets);
    }

    if (failed_assets !== undefined) {
      setParts.push('failed_assets = ?');
      values.push(failed_assets);
    }

    if (error_log !== undefined) {
      setParts.push('error_log = ?');
      values.push(error_log);
    }

    if (metadata !== undefined) {
      setParts.push('metadata = ?');
      values.push(JSON.stringify(metadata));
    }

    // Auto-set completed_at when status changes to completed/failed
    if (status === 'completed' || status === 'failed') {
      setParts.push('completed_at = datetime(\'now\')');
    }

    // Auto-set started_at when status changes to running
    if (status === 'running') {
      setParts.push('started_at = datetime(\'now\')');
    }

    if (setParts.length === 0) {
      return this.getJobById(jobId);
    }

    const sql = `
      UPDATE migration_jobs 
      SET ${setParts.join(', ')}
      WHERE job_id = ?
    `;

    values.push(jobId);
    await this.run(sql, values);

    return this.getJobById(jobId);
  }

  /**
   * Mark job as completed with final status
   * @param {string} jobId - Job identifier
   * @param {string} status - Final status (completed or failed)
   * @param {string} errorMessage - Error message if failed
   * @returns {Promise<Object>} Updated job record
   */
  async completeJob(jobId, status, errorMessage = null) {
    const updates = {
      status,
      error_log: errorMessage
    };

    return this.updateJobProgress(jobId, updates);
  }

  /**
   * Get all migration jobs with optional filtering
   * @param {Object} filters - Optional filters
   * @param {string} filters.status - Filter by status
   * @param {number} filters.limit - Limit number of results
   * @returns {Promise<Array>} Array of job records
   */
  async getJobs(filters = {}) {
    let sql = `
      SELECT 
        id,
        job_id,
        status,
        total_assets,
        processed_assets,
        failed_assets,
        error_log,
        metadata,
        started_at,
        completed_at,
        created_at
      FROM migration_jobs
    `;

    const conditions = [];
    const values = [];

    if (filters.status) {
      conditions.push('status = ?');
      values.push(filters.status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      values.push(filters.limit);
    }

    const jobs = await this.all(sql, values);

    // Parse metadata for each job
    return jobs.map(job => {
      if (job.metadata) {
        try {
          job.metadata = JSON.parse(job.metadata);
        } catch (e) {
          job.metadata = {};
        }
      }
      return job;
    });
  }

  /**
   * Get migration job statistics
   * @returns {Promise<Object>} Migration statistics
   */
  async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running_jobs,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_jobs,
        SUM(total_assets) as total_assets_migrated,
        SUM(processed_assets) as total_processed,
        SUM(failed_assets) as total_failed
      FROM migration_jobs
    `;

    return this.get(sql);
  }

  /**
   * Delete old migration job records
   * @param {number} daysOld - Delete jobs older than this many days
   * @returns {Promise<number>} Number of deleted records
   */
  async cleanupOldJobs(daysOld = 30) {
    const sql = `
      DELETE FROM migration_jobs 
      WHERE created_at < datetime('now', '-${daysOld} days')
      AND status IN ('completed', 'failed')
    `;

    const result = await this.run(sql);
    return result.changes || 0;
  }
}

module.exports = MigrationRepository;
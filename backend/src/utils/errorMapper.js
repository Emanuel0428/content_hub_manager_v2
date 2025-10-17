module.exports = function mapError(err){
  // Minimal mapping for demo
  if(!err) return {status:500, message:'unknown_error'}
  if(err.code === 'SQLITE_BUSY') return {status:503, message:'database_busy'}
  return {status:500, message: err.message || 'server_error'}
}
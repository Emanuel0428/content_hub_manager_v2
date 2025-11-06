module.exports = function mapError(err){
  // Error mapping logic
  if (err.isCustom) {
    return {
      status: err.statusCode || 400,
      message: err.customMessage || 'An error occurred'
    }
  }
  return {
    status: 500,
    message: 'Internal server error'
  }
  
}
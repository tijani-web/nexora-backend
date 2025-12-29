/**
 * Middleware to validate pagination query parameters
 */
export const validatePagination = (req, res, next) => {
  const { limit, offset } = req.query;
  
  req.query.limit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
  req.query.offset = Math.max(parseInt(offset) || 0, 0);
  
  next();
};
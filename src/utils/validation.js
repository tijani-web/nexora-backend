/**
 * Validate UUID format
 */
export const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (limit, offset) => {
  const validLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
  const validOffset = Math.max(parseInt(offset) || 0, 0);
  return { limit: validLimit, offset: validOffset };
};
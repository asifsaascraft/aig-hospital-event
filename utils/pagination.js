/**
 * Get Pagination
 *
 * Query Params:
 * ?page=1
 * ?limit=20
 */

export const getPagination = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1)

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100)

  const skip = (page - 1) * limit

  return {
    page,
    limit,
    skip,
  }
}

/**
 * Build Pagination Meta
 */

export const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,

    totalPages,

    hasPreviousPage: page > 1,

    hasNextPage: page < totalPages,
  }
}

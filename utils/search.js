/**
 * Build Search Query
 *
 * Usage:
 * buildSearch(req, [
 *   "fullName",
 *   "email",
 *   "mobile",
 * ]);
 */

const buildSearch = (req, searchableFields = []) => {
  const { search } = req.query

  if (!search || !searchableFields.length) {
    return {}
  }

  return {
    $or: searchableFields.map((field) => ({
      [field]: {
        $regex: search,
        $options: 'i',
      },
    })),
  }
}

export default buildSearch

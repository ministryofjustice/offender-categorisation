export const removeFilterFromFullUrl = (filter, key, fullUrl, numberOfFiltersApplied) => {
  const startPositionOfFilterInUrl = fullUrl.indexOf(filter) - (key.length + 7)
  return (
    fullUrl.substring(
      0,
      fullUrl[startPositionOfFilterInUrl - 1] === '&' || numberOfFiltersApplied === 1
        ? startPositionOfFilterInUrl - 1
        : startPositionOfFilterInUrl
    ) +
    fullUrl.substring(
      fullUrl.indexOf(filter) + filter.length + (fullUrl[startPositionOfFilterInUrl - 1] === '&' ? 0 : 1),
      fullUrl.length
    )
  )
}

export default removeFilterFromFullUrl

module.exports = endTime => {
  const now = new Date()
  const secondsUntilExpiry = now.getSeconds() + (endTime - 300)
  return now.setSeconds(secondsUntilExpiry)
}

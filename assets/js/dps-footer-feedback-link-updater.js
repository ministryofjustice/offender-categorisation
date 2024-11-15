/**
 * The DPS Component footer provides a Feedback link in the format:
 *
 * https://eu.surveymonkey.com/r/FRZYGVQ?source=[source_value]
 *
 * We are expected to replace the [source_value] with the current host and path.
 */
function updateFeedbackFooterLinkHref() {
  const footer = document.querySelector('footer')

  if (!footer) {
    // eslint-disable-next-line no-console
    console.error('Unable to locate the footer element. Survey link replacement aborted.')
    return
  }

  const surveyMonkeyPlaceholderUrl = 'https://eu.surveymonkey.com/r/FRZYGVQ?source=[source_value]'
  const anchorElements = footer.querySelectorAll('a')

  anchorElements.forEach(element => {
    const currentHref = element.getAttribute('href')

    if (currentHref && currentHref === surveyMonkeyPlaceholderUrl) {
      const currentPage = window.location.hostname + window.location.pathname
      const newHref = surveyMonkeyPlaceholderUrl.replace('[source_value]', currentPage)

      element.setAttribute('href', newHref)
    }
  })
}

if (document.readyState !== 'loading') {
  updateFeedbackFooterLinkHref()
} else {
  document.addEventListener('DOMContentLoaded', updateFeedbackFooterLinkHref)
}

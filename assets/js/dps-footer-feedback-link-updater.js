/**
 * The DPS Component footer provides a Feedback link in the format:
 *
 * https://eu.surveymonkey.com/r/FRZYGVQ?source=[source_value]
 *
 * We are expected to replace the [source_value] with the current host and path.
 */
function updateFeedbackFooterLinkHref() {
  var footer = document.querySelector('footer')

  if (!footer) {
    console.error('Unable to locate the footer element. Survey link replacement aborted.')
    return
  }

  var surveyMonkeyPlaceholderUrl = 'https://eu.surveymonkey.com/r/FRZYGVQ?source=[source_value]'
  var anchorElements = footer.querySelectorAll('a')

  anchorElements.forEach(function (element) {
    var currentHref = element.getAttribute('href')

    if (currentHref && currentHref === surveyMonkeyPlaceholderUrl) {
      var currentPage = window.location.hostname + window.location.pathname
      var newHref = surveyMonkeyPlaceholderUrl.replace('[source_value]', currentPage)

      element.setAttribute('href', newHref)
    }
  })
}

if (document.readyState !== 'loading') {
  updateFeedbackFooterLinkHref()
} else {
  document.addEventListener('DOMContentLoaded', updateFeedbackFooterLinkHref)
}

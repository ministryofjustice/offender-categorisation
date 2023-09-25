var anchorElements = document.querySelectorAll('.connect-dps-common-footer__link')

anchorElements.forEach(function (element) {
  var currentHref = element.getAttribute('href')

  if (currentHref && currentHref.startsWith('https://eu.surveymonkey.com/r/FRZYGVQ?source=')) {
    var currentPage = window.location.hostname + window.location.pathname
    var newHref = 'https://eu.surveymonkey.com/r/FRZYGVQ?source=' + currentPage

    element.setAttribute('href', newHref)
  }
})

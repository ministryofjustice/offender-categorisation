import * as GOVUKFrontend from '/assets/govuk/govuk-frontend.min.js'
import * as MOJFrontend from '/assets/moj/moj-frontend.min.js'

// expose for legacy code
window.GOVUKFrontend = GOVUKFrontend
window.MOJFrontend = MOJFrontend

GOVUKFrontend.initAll()
MOJFrontend.initAll()

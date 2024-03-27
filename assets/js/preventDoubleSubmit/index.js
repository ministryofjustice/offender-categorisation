;(() => {
  'use strict'

  const disableSubmitButtons = event => {
    event.currentTarget.querySelectorAll('button[data-prevent-double-click="true"]').forEach(button => {
      button.dataset.clicked = 'true'
      button.disabled = true
      button.setAttribute('aria-disabled', 'true')
    })
  }

  document.querySelectorAll('form').forEach(form => form.addEventListener('submit', disableSubmitButtons))
})()

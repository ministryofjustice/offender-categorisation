;(() => {
  const disableSubmitButtons = event => {
    event.currentTarget.querySelectorAll('button[data-prevent-double-click="true"]').forEach(button => {
      // eslint-disable-next-line no-param-reassign
      button.dataset.clicked = 'true'
      // eslint-disable-next-line no-param-reassign
      button.disabled = true
      button.setAttribute('aria-disabled', 'true')
    })
  }

  document.querySelectorAll('form').forEach(form => form.addEventListener('submit', disableSubmitButtons))
})()

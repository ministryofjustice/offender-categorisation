function getAllCheckboxesWithIdPrefix(checkboxesIdPrefix) {
  const checkboxes = []
  let checkbox = null
  let i = 1
  while ((checkbox = document.getElementById(checkboxesIdPrefix + (i > 1 ? `-${i}` : ''))) !== null) {
    checkboxes.push(checkbox)
    i++
  }
  return checkboxes
}

function toggleAllCheckboxes(checkboxesIdPrefix, setToTrue, selectAllButtonId) {
  getAllCheckboxesWithIdPrefix(checkboxesIdPrefix).forEach(checkbox => {
    checkbox.checked = setToTrue
  })
  setSelectAllButtonTextBasedOnSelectedCheckboxes(selectAllButtonId, checkboxesIdPrefix)
}

function allCheckboxesAreChecked(checkboxesIdPrefix) {
  for (let checkbox of getAllCheckboxesWithIdPrefix(checkboxesIdPrefix)) {
    if (!checkbox.checked) {
      return false
    }
  }
  return true
}

function setSelectAllButtonTextBasedOnSelectedCheckboxes(selectAllButtonId, checkboxesIdPrefix) {
  document.getElementById(selectAllButtonId).innerText = allCheckboxesAreChecked(checkboxesIdPrefix) ? 'Deselect all' : 'Select all'
}

document
  .getElementById('selectAllSuitabilityForOpenConditionsFilter')
  .addEventListener(
    'click',
    () => toggleAllCheckboxes(
      'suitabilityForOpenConditions[]',
      !allCheckboxesAreChecked('suitabilityForOpenConditions[]'),
      'selectAllSuitabilityForOpenConditionsFilter'
    )
  )

getAllCheckboxesWithIdPrefix('suitabilityForOpenConditions[]').forEach(checkbox => {
  checkbox
    .addEventListener(
      'change',
      () => {
        setSelectAllButtonTextBasedOnSelectedCheckboxes(
          'selectAllSuitabilityForOpenConditionsFilter',
          'suitabilityForOpenConditions[]'
        )
      }
    )
})

document.getElementById('hideFilterButton').addEventListener('click', async (event) => {
  let hideFilter = false
  if (event.target.innerText === 'Hide filter') {
    document.getElementById('filterContainer').classList.add('govuk-visually-hidden')
    document.getElementById('tableContainer').classList.remove("govuk-grid-column-two-thirds")
    event.target.innerText = 'Show filter'
    hideFilter = true
  } else {
    document.getElementById('tableContainer').classList.add('govuk-grid-column-two-thirds')
    document.getElementById('filterContainer').classList.remove('govuk-visually-hidden')
    event.target.innerText = 'Hide filter'
  }
  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content')
  await fetch('/recategoriserHome/hide-filter', {
    method: 'POST',
    body: JSON.stringify({ hideFilter }),
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
  });
})

function toggleAllCheckboxes(checkboxesName, setToTrue, selectAllButtonId) {
  document.getElementsByName(checkboxesName).forEach(checkbox => {
    checkbox.checked = setToTrue
  })
  setSelectAllButtonTextBasedOnSelectedCheckboxes(selectAllButtonId, checkboxesName)
}

function allCheckboxesAreChecked(checkboxesName) {
  for (let checkbox of document.getElementsByName(checkboxesName)) {
    if (!checkbox.checked) {
      return false
    }
  }
  return true
}

function setSelectAllButtonTextBasedOnSelectedCheckboxes(selectAllButtonId, checkboxesName) {
  document.getElementById(selectAllButtonId).innerText = allCheckboxesAreChecked(checkboxesName) ? 'Deselect all' : 'Select all'
}

const selectAllSuitabilityForOpenConditionsFilter = document
  .getElementById('selectAllSuitabilityForOpenConditionsFilter')
if (selectAllSuitabilityForOpenConditionsFilter) {
  selectAllSuitabilityForOpenConditionsFilter.addEventListener(
    'click',
    () => toggleAllCheckboxes(
      'suitabilityForOpenConditions[]',
      !allCheckboxesAreChecked('suitabilityForOpenConditions[]'),
      'selectAllSuitabilityForOpenConditionsFilter'
    )
  )
}

document.getElementsByName('suitabilityForOpenConditions[]').forEach(checkbox => {
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

const hideFilterButton = document.getElementById('hideFilterButton')
if (hideFilterButton) {
  hideFilterButton.addEventListener('click', async (event) => {
    let hideFilter = false
    const filterContainer = document.getElementById('filterContainer');
    const tableContainer = document.getElementById('tableContainer');
    if (event.target.innerText === 'Hide filter') {
      filterContainer.classList.add('govuk-visually-hidden')
      tableContainer.classList.remove("govuk-grid-column-three-quarters")
      tableContainer.classList.add("govuk-grid-column-full")
      event.target.innerText = 'Show filter'
      hideFilter = true
    } else {
      tableContainer.classList.remove('govuk-grid-column-full')
      tableContainer.classList.add('govuk-grid-column-three-quarters')
      filterContainer.classList.remove('govuk-visually-hidden')
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
}

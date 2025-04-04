function toggleAllCheckboxes(checkboxesName, setToTrue, selectAllButtonId) {
  document.getElementsByName(checkboxesName).forEach(checkbox => {
    checkbox.click()
  })
  setSelectAllButtonTextBasedOnSelectedCheckboxes(selectAllButtonId, checkboxesName)
}

function allCheckboxesAreChecked(checkboxesName) {
  let allCheckboxesChecked = true
  document.getElementsByName(checkboxesName).forEach(checkbox => {
    if (!checkbox.checked) {
      allCheckboxesChecked = false
    }
  })
  return allCheckboxesChecked
}

function setSelectAllButtonTextBasedOnSelectedCheckboxes(selectAllButtonId, checkboxesName) {
  document.getElementById(selectAllButtonId).innerText = allCheckboxesAreChecked(checkboxesName)
    ? 'Deselect all'
    : 'Select all'
}

const selectAllSuitabilityForOpenConditionsFilter = document.getElementById(
  'selectAllSuitabilityForOpenConditionsFilter',
)
if (selectAllSuitabilityForOpenConditionsFilter) {
  selectAllSuitabilityForOpenConditionsFilter.addEventListener('click', () =>
    toggleAllCheckboxes(
      'suitabilityForOpenConditions[]',
      !allCheckboxesAreChecked('suitabilityForOpenConditions[]'),
      'selectAllSuitabilityForOpenConditionsFilter',
    ),
  )
}

document.getElementsByName('suitabilityForOpenConditions[]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    setSelectAllButtonTextBasedOnSelectedCheckboxes(
      'selectAllSuitabilityForOpenConditionsFilter',
      'suitabilityForOpenConditions[]',
    )
  })
})

const hideFilterButton = document.getElementById('hideFilterButton')
if (hideFilterButton) {
  hideFilterButton.addEventListener('click', async event => {
    let hideFilter = false
    const filterContainer = document.getElementById('filterContainer')
    const tableContainer = document.getElementById('tableContainer')
    if (event.target.innerText === 'Hide filter') {
      filterContainer.classList.add('govuk-visually-hidden')
      tableContainer.classList.remove('filterable-table-body-container')
      tableContainer.classList.add('govuk-grid-column-full')
      tableContainer.classList.add('govuk-!-padding-0')
      // eslint-disable-next-line no-param-reassign
      event.target.innerText = 'Show filter'
      hideFilter = true
    } else {
      tableContainer.classList.remove('govuk-grid-column-full')
      tableContainer.classList.remove('govuk-!-padding-0')
      tableContainer.classList.add('filterable-table-body-container')
      filterContainer.classList.remove('govuk-visually-hidden')
      // eslint-disable-next-line no-param-reassign
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
    })
  })
}

// This is to maintain the sort order when the apply filters button is pressed,
// it will store the sort attribute and sort order in hidden inputs to be included
// in the apply filter request
const applyFiltersButton = document.getElementById('applyFilters')
if (applyFiltersButton) {
  applyFiltersButton.addEventListener('click', async () => {
    const table = document.getElementsByClassName('recategorisation-table')[0]
    if (typeof table === 'undefined') {
      return
    }
    const headers = table.getElementsByTagName('th')
    Object.values(headers).forEach(header => {
      const ariaSort = header.getAttribute('aria-sort')
      if (ariaSort === 'ascending' || ariaSort === 'descending') {
        document.getElementById('sortDirection').value = ariaSort
        document.getElementById('sortAttribute').value = header.getAttribute('aria-sort-attribute')
      }
    })
  })
}

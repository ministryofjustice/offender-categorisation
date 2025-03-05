const hideFilterButton = document.getElementById('hideFilterButton')
if (hideFilterButton) {
  hideFilterButton.addEventListener('click', async event => {
    let hideFilter = false
    const filterContainer = document.getElementById('filterContainer')
    const tableContainer = document.getElementById('tableContainer')
    const button = event.target
    if (button.innerText === 'Hide filter') {
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
    await fetch('/categoriserHome/hide-filter', {
      method: 'POST',
      body: JSON.stringify({ hideFilter }),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
    })
  })
}

const applyFiltersButton = document.getElementById('applyFilters')
if (applyFiltersButton) {
  applyFiltersButton.addEventListener('click', async () => {
    const table = document.getElementById('offenderTable')

    if (!table) {
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

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
      'suitabilityForOpenConditionsFilter',
      !allCheckboxesAreChecked('suitabilityForOpenConditionsFilter'),
      'selectAllSuitabilityForOpenConditionsFilter'
    )
  )

getAllCheckboxesWithIdPrefix('suitabilityForOpenConditionsFilter').forEach(checkbox => {
  checkbox
    .addEventListener(
      'change',
      () => {
        setSelectAllButtonTextBasedOnSelectedCheckboxes(
          'selectAllSuitabilityForOpenConditionsFilter',
          'suitabilityForOpenConditionsFilter'
        )
      }
    )
})

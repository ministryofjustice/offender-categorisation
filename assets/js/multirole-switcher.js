/**
 * Handles switching between the various Cat Tool roles in a CSP friendly manner.
 *
 * @param {HTMLSelectElement} selectElement
 */
function handleRoleSwitch(selectElement) {
  const selectedValue = selectElement.value
  window.location = `/switchRole/${selectedValue}`
}

const selectElement = document.getElementById('roleSwitch')
if (selectElement) {
  selectElement.addEventListener('change', function () {
    handleRoleSwitch(this)
  })
}

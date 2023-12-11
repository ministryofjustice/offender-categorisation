/**
 * Handles printing of the Approved View page for Cat / Recat.
 */
function handlePrint() {
  window.print()
}

var handlePrintAnchorElement = document.getElementById('handlePrint')

if (handlePrintAnchorElement) {
  handlePrintAnchorElement.addEventListener('click', function () {
    handlePrint()
  })
}

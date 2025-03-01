// eslint-disable-next-line import/no-unresolved,import/extensions,import/no-absolute-path
import { initAll } from '/assets/govuk/govuk-frontend.min.js'

initAll()
window.MOJFrontend.initAll()

// /**
//  * Overrides the default getCellValue function in MOJFrontend.SortableTable
//  * to support sorting by ISO (YYYY-MM-DD) and UK (DD/MM/YYYY) date formats
//  *
//  * @param {jQuery} cell     - The table cell element containing the value to be sorted.
//  * @returns {number|string} - Returns a timestamp if the value is a recognized date,
//  *                            a float if it's a number, or the original string otherwise.
//  */
// window.MOJFrontend.SortableTable.prototype.getCellValue = function getCellValue(cell) {
//   const val = cell.attr('data-sort-value') || cell.text().trim()
//
//   // Handle empty or missing values (push them to the bottom)
//   if (!val || val === 'null' || val === 'undefined') {
//     return Infinity
//   }
//
//   // Check for ISO (YYYY-MM-DD) date format
//   const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/)
//   if (isoMatch) {
//     return new Date(val).getTime()
//   }
//
//   // Check for UK (DD/MM/YYYY) date format
//   const ukMatch = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
//   if (ukMatch) {
//     return new Date(`${ukMatch[3]}-${ukMatch[2]}-${ukMatch[1]}`).getTime()
//   }
//
//   const floatVal = parseFloat(val)
//   return Number.isNaN(floatVal) ? val : floatVal
// }
//
// document.addEventListener('DOMContentLoaded', function () {
//   console.log('Destroying old sortable tables and reinitializing')
//
//   setTimeout(() => {
//     document.querySelectorAll('[data-module="moj-sortable-table"]').forEach(table => {
//       const $table = $(table)
//       $table.removeData('moj-search-toggle-initialised')
//       new window.MOJFrontend.SortableTable({ table })
//     })
//   })
// })

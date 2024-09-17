const XLSX = require('xlsx')

const createSheet = sheetData => {
  return XLSX.utils.json_to_sheet(sheetData, { header: Object.keys[sheetData[0]] })
}

const createFile = () => XLSX.utils.book_new()

const addSheetToFile = (data, file) => {
  const sheet = createSheet(data)
  XLSX.utils.book_append_sheet(file, sheet)
}

module.exports = {
  createCsv: ({ data, fileName }) => {
    const csv = createFile()

    addSheetToFile(data, csv)

    XLSX.writeFile(csv, `${fileName}.xlsx`)

    return `${fileName}.xlsx`
  },
}

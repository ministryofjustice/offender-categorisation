const { exec } = require('child_process')
const fs = require('fs')

async function zipFiles(inputFilenames, outputFilename) {
  return new Promise((resolve, reject) => {
    const filesList = inputFilenames.join(' ')
    const tarCommand = `tar -czf ${outputFilename} ${filesList}`

    exec(tarCommand, (err, stdout, stderr) => {
      if (err) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return reject(`Error creating zip file: ${stderr}`)
      }
      return resolve(outputFilename)
    })
  })
}

async function cleanUp(inputFilenames) {
  return new Promise((resolve, reject) => {
    Promise.all(inputFilenames.map(filename => fs.promises.unlink(filename)))
      .then(() => resolve('All deleted'))
      // eslint-disable-next-line prefer-promise-reject-errors
      .catch(unlinkErr => reject(`Error deleting files: ${unlinkErr.message}`))
  })
}

module.exports = {
  createExport: async fileNames => {
    await zipFiles(fileNames, `tprs_stats_export.zip`)
    await cleanUp(fileNames)
    return true
  },
}

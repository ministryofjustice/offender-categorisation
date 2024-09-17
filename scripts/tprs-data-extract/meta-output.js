const fs = require('fs').promises

module.exports = {
  createMetaFile: async ({ fileName, contents }) => {
    try {
      await fs.writeFile(fileName, contents, 'utf-8')
    } catch (e) {
      throw new Error(e)
    }
    return fileName
  },
}

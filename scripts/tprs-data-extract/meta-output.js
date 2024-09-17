const fs = require('fs').promises

module.exports = {
  createMetaFile: async ({ fileName, contents }) => {
    try {
      const file = `${fileName}.txt`
      await fs.writeFile(file, contents, 'utf-8')
      return file
    } catch (e) {
      console.error('Error writing file', { e, fileName, contents })
    }
  },
}

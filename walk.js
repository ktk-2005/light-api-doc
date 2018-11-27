const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

function walkLevel(rootDir, callback) {
  return readdir(rootDir).then((dirs) => {
    const promises = dirs.map((child) => {
      const dir = path.join(rootDir, child)

      return stat(dir).then((st) => {
        if (st.isDirectory()) {
          return walkLevel(dir, callback)
        } else if (st.isFile()) {
          return Promise.resolve(callback(dir)).catch((err) => {
            return Promise.reject({ file: dir, error: err })
          })
        }
      })
    })

    return Promise.all(promises)
  })
}

module.exports = function walk(dir, callback) {
  return walkLevel(dir, callback)
}


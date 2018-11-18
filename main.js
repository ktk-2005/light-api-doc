const walk = require('./walk')

const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const mkdirp = promisify(require('mkdirp'))

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

module.exports = (args) => {
  let endpoints = []

  function processFile(file, filename) {
    const lines = file.split(/\r?\n/)

    let jsonStartLine = -1
    let activeEndpoint = null
    let lineIndex = 0

    let error = null

    function doError(message) {
      const err = `Line ${lineIndex}: ${message}`
      console.error(filename, err)
      error = error || err
    }

    for (const line of lines) {
      lineIndex++

      const match = line.match(/^\s*\/\/\s?(.*)$/)
      if (!match) {
        if (jsonStartLine >= 0) {
          doError(`Unclosed JSON block at line ${jsonStartLine}`)
        }
        if (activeEndpoint) {
          activeEndpoint.line = lineIndex
          activeEndpoint = null
        }
        continue
      }

      const comment = match[1]

      const apiMatch = comment.match(/@api\s+(\w+)\s+(\S+)\s*/)
      if (apiMatch) {
        const method = apiMatch[1].toUpperCase()
        const url = apiMatch[2]

        activeEndpoint = { filename, method, url, lines: [] }
        endpoints.push(activeEndpoint)
      } else if (activeEndpoint) {
        const jsonRep = comment.replace(/\s*@json\s*{\s*$/, '')
        if (comment !== jsonRep) {
          activeEndpoint.lines.push(jsonRep)
          activeEndpoint.lines.push('```json')
          activeEndpoint.lines.push('{')
          jsonStartLine = lineIndex
        } else if (comment.match(/}\s*/)) {
          jsonStartLine = -1
          activeEndpoint.lines.push('}')
          activeEndpoint.lines.push('```')
        } else {
          activeEndpoint.lines.push(comment)
        }
      }
    }

    if (jsonStartLine >= 0) {
      doError(`Unclosed JSON block at line ${jsonStartLine}`)
    }

    if (error) throw error
  }

  const outputDir = args.outdir || path.dirname(args.o)

  const prettyPath = p => p.replace(/\\/g, '/')

  const relativeTemplateDir = (() => {
    const absOutputDir = path.resolve(outputDir)
    const absTemplatePath = path.resolve(args.t)
    const absTemplateDir = path.dirname(absTemplatePath)

    const length = Math.min(absOutputDir.length, absTemplateDir.length) | 0
    let begin = 0
    for (; begin < length; begin++) {
      if (absOutputDir[begin] != absTemplateDir[begin]) break
    }

    const commonRoot = absOutputDir.substr(0, begin)
    const relative = path.relative(commonRoot, absTemplatePath)
    return prettyPath(relative)
  })()

  const prelude = [
    '<!-- This file is autogenerated, do not modify directly,',
    '     If you wish to edit the contents update the documentation',
    `     comments or the template file: ${relativeTemplateDir} -->`,
  ]

  function processTemplate(template) {
    const lines = template.split(/\r?\n/)

    let result = [...prelude]
    let lineIndex = 0
    let error = null

    function doError(message) {
      error = error || 'Template expansion error'
      const prefix = `Line ${lineIndex}:`
      console.error(prefix, message)
    }

    for (const line of lines) {
      lineIndex++

      const apiMatch = line.match(/\s*@api\s+(\S+)(\s+(\S+))?\s*/)
      if (apiMatch) {
        const url = apiMatch[1]
        const method = (apiMatch[3] || '').toUpperCase()

        let foundAny = false

        for (const endpoint of endpoints) {
          if (endpoint.url !== url) continue
          if (method && endpoint.method != method) continue

          foundAny = true
          if (endpoint.templateLine !== undefined) {
            console.error(`Line ${lineIndex}: Endpoint already inserted at line ${endpoint.templateLine}`)
            process.exitCode = 1
            continue
          }

          endpoint.templateLine = lineIndex

          let codeUrl = prettyPath(path.relative(outputDir, endpoint.filename))
          if (endpoint.line)
            codeUrl += `#L${endpoint.line}`

          result.push(`### [${endpoint.method} ${endpoint.url}](${codeUrl})`)
          result.push('', ...endpoint.lines)
        }

        if (!foundAny) {
          if (method) doError(`Endpoint not found: ${method} ${url}`)
          else doError(`Endpoint not found: ${url}`)
        }

      } else {
        result.push(line)
      }
    }

    let numUndefined = 0
    for (const endpoint of endpoints) {
      if (endpoint.templateLine !== undefined) continue

      console.error('API endpoint not in template', endpoint.method, endpoint.url)
      numUndefined++
    }

    if (numUndefined > 0 && !error) {
      error = `Endpoints not defined in template: ${numUndefined}`
    }

    if (error) throw error
    return result
  }

  const pattern = new RegExp(args.pattern)
  return walk(args.dir, (dir) => {
    if (!dir.match(pattern)) return
    return readFile(dir, { encoding: 'utf-8' }).then(file => processFile(file, dir))
  }).catch((error) => {
    console.error('Failed to process file:', error.file)
    throw error.error
  }).then(() => {
    return readFile(args.t, { encoding: 'utf-8' }).then(file => processTemplate(file))
  }).then((lines) => {
    return mkdirp(path.dirname(args.o)).then(() => lines)
  }).then((lines) => {
    const str = lines.join('\n')
    return writeFile(args.o, str)
  }).then(() => {
    if (!args.endpoints) return

    const endpointSet = new Set(endpoints.map(e => `${e.method} ${e.url}`))
    return readFile(args.endpoints, { encoding: 'utf-8' }).then((file) => {
      const refEndpoints = JSON.parse(file)
      let numNotFound = 0
      for (const ep of refEndpoints) {
        if (!endpointSet.has(ep)) {
          console.error('Undocumented endpoint: ', ep)
          numNotFound++
        }
      }
      if (numNotFound > 0)
        throw `Endpoints not documented: ${numNotFound}`
    })
  })
}

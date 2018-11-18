#!/usr/bin/env node

const ArgumentParser = require('argparse').ArgumentParser
const main = require('./main')

const parser = new ArgumentParser({
  version: '0.2.2',
  addHelp: true,
  description: 'Lightweight API documentation generator',
})

parser.addArgument('-t', {
  help: 'Template filename',
  metavar: 'template.md',
  required: true,
})

parser.addArgument('-o', {
  help: 'Output filename',
  metavar: 'output.md',
  required: true,
})

parser.addArgument('--outdir', {
  help: 'Output directory for relative links (overrides -o)',
})

parser.addArgument('--pattern', {
  help: 'Regex pattern the files must match',
  defaultValue: '\.js$',
})

parser.addArgument('dir', {
  help: 'Source search directory',
})

const args = parser.parseArgs()
main(args).catch((error) => {
  console.error(error)
  process.exitCode = 1
})


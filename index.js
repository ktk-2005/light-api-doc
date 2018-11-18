#!/usr/bin/env node

const ArgumentParser = require('argparse').ArgumentParser

const parser = new ArgumentParser({
	version: '0.1.0',
	addHelp: true,
	description: 'Lightweight API documentation generator',
})

parser.addArgument('-t', {
	help: 'Template filename',
	metavar: 'template.md',
})

parser.addArgument('-o', {
	help: 'Output filename',
	metavar: 'output.md',
})

parser.addArgument('dir', {
	help: 'Source search directory',
})

const args = parser.parseArgs()

console.log(args)


import walk from '@fcostarodrigo/walk'
import fs = require('fs-extra')
import { namedNode } from '@rdfjs/data-model'
import { turtle } from '@tpluscode/rdf-string'
import { resolve, dirname } from 'path'

require = require("esm")(module)

const base = process.env.URL || 'http://localhost:8080'

function loader(basePath: string) {
    return (path: string): Promise<string> => {
        return fs.readFile(resolve(basePath, path), 'utf8')
    }
}

async function main() {
    for await (const file of walk('src')) {
        if (!file.endsWith('ts')) continue

        const term = file.replace(/^src\/(.+)\.ts$/, '$1')
        const outFile = file
            .replace(/^src\/(.+)\.ts$/, 'dist/$1.ttl')

        const { build } = await import((`./${file}`))
        const dataset = await build(namedNode(`${base}/${term}`), loader(dirname(file)))

        await fs.outputFile(outFile, turtle`${dataset}`.toString({ base }))
    }
}

main().then(() => process.exit()).catch(e => {
    console.error(e)
    process.exit(1)
})

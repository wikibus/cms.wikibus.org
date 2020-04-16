import walk from '@fcostarodrigo/walk'
import cf = require('clownface')
import $rdf = require('rdf-ext')
import fs = require('fs-extra')
import { namedNode } from '@rdfjs/data-model'
import {turtle} from '@tpluscode/rdf-string';

require = require("esm")(module)

const base = process.env.URL || 'http://localhost:8080'

async function main() {
    for await (const file of walk('src')) {
        const term = file.replace(/^src\/(.+)\.ts$/, '$1')
        const outFile = file
            .replace(/^src\/(.+)\.ts$/, 'dist/$1.ttl')

        const graph = cf({
            dataset: $rdf.dataset(),
            term: namedNode(`${base}/${term}`)
        })

        const { build } = await import((`./${file}`))
        await build(graph)

        await fs.outputFile(outFile, turtle`${graph.dataset}`.toString({ base }))
    }
}

main().then(() => process.exit()).catch(e => {
    console.error(e)
    process.exit(1)
})

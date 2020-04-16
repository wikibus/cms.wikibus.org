import walk from '@fcostarodrigo/walk'
import cf = require('clownface')
import $rdf = require('rdf-ext')
import { toFile } from 'rdf-utils-fs'
import fs = require('fs-extra')
import { namedNode } from '@rdfjs/data-model'

require = require("esm")(module)

async function main() {
    for await (const file of walk('src')) {
        const term = file.replace(/\.ts$/, '')
        const outFile = file
            .replace(/^src\/(.+)\.ts$/, 'dist/$1.ttl')

        const graph = cf({
            dataset: $rdf.dataset(),
            term: namedNode(term)
        })

        const { build } = await import((`./${file}`))
        await build(graph)

        await fs.ensureFile(outFile)
        await toFile(graph.dataset.toStream(), outFile)
    }
}

main().then(() => process.exit()).catch(e => {
    console.error(e)
    process.exit(1)
})

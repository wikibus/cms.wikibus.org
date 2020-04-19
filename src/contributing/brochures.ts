import HowTo from '@rdfine/schema/HowTo'
import cf, {SingleContextClownface} from 'clownface'
import $rdf = require('rdf-ext')
import {DataFactory, NamedNode} from 'rdf-js';
import unified = require('unified')
import markdown = require('remark-parse')
import html = require('remark-html')
import {HowToDirection, HowToStep} from '@rdfine/schema';
import HowToStepMixin from '@rdfine/schema/HowToStep';
import HowToDirectionMixin from '@rdfine/schema/HowToDirection';
import ImageObjectMixin from '@rdfine/schema/ImageObject';

const processor = unified()
    .use(markdown, { commonmark: true} )
    .use(html)

async function steps(g: SingleContextClownface, file: Promise<string>) {
    async function *generate() {
        const syntaxTree: any = processor.parse(await file)

        let step: HowToStep
        let direction: HowToDirection
        for(const child of syntaxTree.children) {
            if (child.type === 'heading' && child.depth === 1) {
                if (step) yield step

                step = new HowToStepMixin.Class(g.blankNode(), {
                    name: processor.stringify(child)
                })
            } else if (child.type === 'heading' && child.depth === 2) {
                direction = new HowToDirectionMixin.Class(g.blankNode(), { text: '' })
            } else if (child.type === 'paragraph') {
                if (child.children.length === 1 && child.children[0].type === 'image') {
                    const image = child.children[0]
                    direction[image.alt] = new ImageObjectMixin.Class(g.blankNode(), {
                        contentUrl: g.namedNode(image.url),
                    })
                } else {
                    direction.text += processor.stringify(child)
                }
            }
        }
    }

    const result = []
    for await (const step of generate()) {
        result.push(step)
    }

    return result
}

export const build = async (term: NamedNode, load) => {
    const graph = cf({
        dataset: $rdf.dataset(),
        term
    })

    const howTo = new HowTo.Class(graph, {
        name: "Contributing brochures to wikibus.org",
        /* step: [{
            types: [schema.HowToStep],
            name: 'Log in',
            position: 1,
            text: await markdown(load('./brochures-step-1.md')),
            itemListElement: [<HowToDirection>{
                types: [schema.HowToDirection],
                duringMedia: {
                    types: [schema.ImageObject],
                    contentUrl: namedNode('/assets/images/step-login.png'),
                }
            }]
        }, {
            types: [schema.HowToStep],
            name: 'Get in touch',
            position: 2,
            text: await markdown(load('./brochures-step-2.md')),
            itemListElement: [<HowToDirection>{
                types: [schema.HowToDirection],
                duringMedia: {
                    types: [schema.ImageObject],
                    contentUrl: namedNode('/assets/images/step-social-contact.png'),
                }
            }]
        }, {
            types: [schema.HowToStep],
            name: 'Add brochure',
            position: 3,
            text: await markdown(load('./brochures-step-3.md')),
            itemListElement: [<HowToDirection>{
                types: [schema.HowToDirection],
                duringMedia: {
                    types: [schema.ImageObject],
                    contentUrl: namedNode('/assets/images/step-create-contact.png'),
                }
            }]
        }, {
            types: [schema.HowToStep],
            name: 'Add brochure',
            position: 4,
            text: await markdown(load('./brochures-step-4.md')),
            itemListElement: [<HowToDirection>{
                types: [schema.HowToDirection],
                duringMedia: {
                    types: [schema.ImageObject],
                    contentUrl: namedNode('/assets/images/step-upload.png'),
                }
            }]
        }] */
    })

    howTo.step = [...await steps(graph, load('./brochures.md'))]

    return graph.dataset
}

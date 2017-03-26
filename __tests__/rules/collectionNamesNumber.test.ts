import { Rule } from '../../src/rules/collectionNamesNumber'

describe('collection-names-number', () => {
  it('has correct metadata', async () => {
    const rule = new Rule({
      number: 'plural',
    })

    const m = rule.getMetadata()

    expect(m).toMatchSnapshot()
  })
})
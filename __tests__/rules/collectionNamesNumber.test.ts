import { Rule } from '../../src/rules/collectionNamesNumber'
jest.mock('../../src/db')
import { TestDbWrapper } from '../../src/db'

describe('collection-names-number', () => {
  it('should have correct metadata', async () => {
    const rule = new Rule({
      number: 'plural',
    })

    const m = rule.getMetadata()

    expect(m).toMatchSnapshot()
  })

  it("should work when number is 'singular'", async () => {
    const db = new TestDbWrapper();

    (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce(['cow', 'cats'])

    const rule = new Rule({
      number: 'singular',
    })

    const result = await rule.apply(db)

    expect(result).toMatchSnapshot()
  })

  it("should work when number is 'plural'", async () => {
    const db = new TestDbWrapper();

    (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce(['cow', 'cats'])

    const rule = new Rule({
      number: 'plural',
    })

    const result = await rule.apply(db)

    expect(result).toMatchSnapshot()
  })
})
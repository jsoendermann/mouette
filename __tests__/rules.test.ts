import { flatten } from 'lodash'
import * as humps from 'humps'
import { IDb, TestDbWrapper } from '../src/db'
import generateRuleTestConfigs from './helpers/generateRuleTestConfigs'
import { AbstractRule, RuleFailure, IRuleFailureJson } from '../src/rule'


interface IRuleTestDetails {
  name: string
  dbMock: (db: IDb) => void
  configs?: any[]
  // invalidConfigs: any[] // TODO
}
const ruleDetails: IRuleTestDetails[] = [
  {
    name: 'collection-names-case',
    dbMock: (db: IDb) => {
      db.getCollectionNames = jest.fn();
      (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce([
        '',
        '_123',
        '123',
        'flower',
        'flower_bed',
        'flowerBed',
        'my_flowerBed',
      ])
    },
  },
  {
    name: 'collection-names-number',
    dbMock: (db: IDb) => {
      db.getCollectionNames = jest.fn();
      (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce([
        '',
        '123',
        'cow',
        'cows',
        'flower_bed',
        'flower_beds',
        'flowerBed',
        'flowerBeds',
        'water',
        'data',
      ])
    },
  },
  {
    name: 'key-names-case',
    dbMock: (db: IDb) => {
      db.getCollectionNames = jest.fn();
      (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce(['collection'])
      db.getKeysInCollection = jest.fn();
      (db.getKeysInCollection as jest.Mock<any>).mockReturnValueOnce([
        '',
        '_123',
        '123',
        'flower',
        'flower_bed',
        'flowerBed',
        'my_flowerBed',
        'userID',
      ])
    },
  },
  {
    name: 'keys-that-end-in-at-should-refer-to-dates',
    dbMock: (db: IDb) => {
      db.getCollectionNames = jest.fn();
      (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce(['collection'])
      db.getKeysInCollection = jest.fn();
      (db.getKeysInCollection as jest.Mock<any>).mockReturnValueOnce([
        'qwfp',
        'qwfp',
        'arstAt',
        'arstAt',
        'At',
      ])
      db.doesContainInCollection = jest.fn();
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(true);
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(false);
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(true);
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(false);
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(true)
    },
    configs: [
      {
        'allow-stringified-days': false,
        'stringified-days-regex': '**',
      },
      {
        'allow-stringified-days': true,
        'stringified-days-regex': '^\\d\\d\\d\\d-[01]\\d-[0123]\\d$',
      },
      {
        'allow-stringified-days': true,
        'stringified-days-regex': 'FOOBAR',
      },
    ],
  },
  {
    name: 'max-key-count',
    dbMock: (db: IDb) => {
      db.getCollectionNames = jest.fn();
      (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce(['collection1', 'collection2'])
      db.getKeysInCollection = jest.fn();
      (db.getKeysInCollection as jest.Mock<any>).mockReturnValueOnce([
        '1', '2',
      ]);
      (db.getKeysInCollection as jest.Mock<any>).mockReturnValueOnce([
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
      ])
    },
    configs: [
      { 'maximum-excluding-_id': 2 },
      { 'maximum-excluding-_id': 5 },
      { 'maximum-excluding-_id': 99 },
    ],
  },
  {
    name: 'no-bad-key-names',
    dbMock: (db: IDb) => {
      db.getCollectionNames = jest.fn();
      (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce(['collection1', 'collection2'])
      db.getKeysInCollection = jest.fn();
      (db.getKeysInCollection as jest.Mock<any>).mockReturnValueOnce([
        'goodKey', 'betterKey', 'bestKey',
      ]);
      (db.getKeysInCollection as jest.Mock<any>).mockReturnValueOnce([
        'stuff', 'data', 'value',
      ])
    },
    configs: [
      { 'names-considered-bad': ['stuff', 'data'] },
    ],
  },
  {
    name: 'no-leading-underscores-in-key-names',
    dbMock: (db: IDb) => {
      db.getCollectionNames = jest.fn();
      (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce(['collection1'])
      db.getKeysInCollection = jest.fn();
      (db.getKeysInCollection as jest.Mock<any>).mockReturnValueOnce([
        '_', '_id', '_arst', 'arst', '__v',
      ])
    },
  },
  {
    name: 'no-null',
    dbMock: (db: IDb) => {
      db.getCollectionNames = jest.fn();
      (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce(['collection1'])
      db.getKeysInCollection = jest.fn();
      (db.getKeysInCollection as jest.Mock<any>).mockReturnValueOnce([
        '_', '_id', '_arst', 'arst',
      ])
      db.doesContainInCollection = jest.fn();
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(true);
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(false);
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(true);
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(false)
    },
  },
  {
    name: 'no-numbers-saved-as-string',
    dbMock: (db: IDb) => {
      db.getCollectionNames = jest.fn();
      (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce(['collection'])
      db.getKeysInCollection = jest.fn();
      (db.getKeysInCollection as jest.Mock<any>).mockReturnValueOnce([
        'key1', 'key2',
      ])
      db.doesContainInCollection = jest.fn();
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(true);
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(false)
    },
  },
  {
    name: 'no-undefined',
    dbMock: (db: IDb) => {
      db.getCollectionNames = jest.fn();
      (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce(['collection1'])
      db.getKeysInCollection = jest.fn();
      (db.getKeysInCollection as jest.Mock<any>).mockReturnValueOnce([
        '_', '_id', '_arst', 'arst',
      ])
      db.doesContainInCollection = jest.fn();
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(true);
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(false);
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(true);
      (db.doesContainInCollection as jest.Mock<any>).mockReturnValueOnce(false)
    },
  },
  {
    name: 'question-keys-should-refer-to-booleans',
    configs: [
      { 'boolean-key-prefixes': ['is', 'does'] },
    ],
    dbMock: (db: IDb) => {
      db.getCollectionNames = jest.fn();
      (db.getCollectionNames as jest.Mock<any>).mockReturnValueOnce(['collection'])
      db.getKeysInCollection = jest.fn();
      (db.getKeysInCollection as jest.Mock<any>).mockReturnValueOnce([
        'qwfp',
        'qwfp',
        'isQwfp',
        'isQwfp',
        'is',
        'hasQwfp',
        'hasQwfp',
      ])
      db.getTypesOfKeyInCollection = jest.fn();
      (db.getTypesOfKeyInCollection as jest.Mock<any>).mockReturnValueOnce(['null']);
      (db.getTypesOfKeyInCollection as jest.Mock<any>).mockReturnValueOnce(['string']);
      (db.getTypesOfKeyInCollection as jest.Mock<any>).mockReturnValueOnce(['boolean']);
      (db.getTypesOfKeyInCollection as jest.Mock<any>).mockReturnValueOnce(['number', 'object']);
      (db.getTypesOfKeyInCollection as jest.Mock<any>).mockReturnValueOnce(['missing', 'null']);
      (db.getTypesOfKeyInCollection as jest.Mock<any>).mockReturnValueOnce(['array', 'boolean']);
      (db.getTypesOfKeyInCollection as jest.Mock<any>).mockReturnValueOnce(['boolean'])
    },
  },
]

interface IAugmentedRuleTestDetails extends IRuleTestDetails {
  Rule: any
  configs: any
  failures: RuleFailure[]
  failuresJson: IRuleFailureJson[]
}


describe('rules', () => {
  let augmentedRuleDetails: IAugmentedRuleTestDetails[]

  beforeAll(async () => {
    augmentedRuleDetails = await Promise.all(ruleDetails.map(async details => {
      const { Rule } = require(
        '../src/rules/' + humps.camelize(details.name),
      )

      const configs = details.configs ||
        generateRuleTestConfigs(Rule.metadata.optionsDescription)

      const failuresPromises = configs.map(async config => {
        const rule = new Rule({
          ...config,
          severity: 'warning',
        }) as AbstractRule
        const db = new TestDbWrapper()
        details.dbMock(db)
        return rule.getFailures(db)
      }) as Array<Promise<RuleFailure[]>>

      const failures: RuleFailure[] = flatten(
        await Promise.all(failuresPromises),
      )

      const failuresJsonPromises = configs.map(async config => {
        const rule = new Rule({
          ...config,
          severity: 'warning',
        }) as AbstractRule
        const db = new TestDbWrapper()
        details.dbMock(db)
        const failuresTmp = await rule.getFailures(db)
        return failuresTmp.map(f => rule.getJsonForFailure(f))
      }) as Array<Promise<IRuleFailureJson[]>>

      const failuresJson: IRuleFailureJson[] = flatten(
        await Promise.all(failuresJsonPromises),
      )

      return {
        ...details,
        Rule,
        configs,
        failures,
        failuresJson,
      }
    }))
  })

  it('should have correct metadata', () => {
    augmentedRuleDetails.forEach(({ name, Rule }) => {
      expect(Rule.metadata).toMatchSnapshot(`${name}.metadata`)
    })
  })

  it('should validate configurations correctly', () => {
    augmentedRuleDetails.forEach(({ Rule, configs }) => {
      configs.forEach(config => {
        expect(() => new Rule({
          severity: 'error',
          ...config,
        })).not.toThrow()
      })
    })
  })

  it('should generate appropriate failures', () => {
    augmentedRuleDetails.forEach(({ name, failures }) => {
      expect(failures).toMatchSnapshot(`${name}.failures`)
    })
  })

  it('should properly convert failures to json', () => {
    augmentedRuleDetails.forEach(({ name, failuresJson }) => {
      expect(failuresJson).toMatchSnapshot(`${name}.failuresJson`)
    })
  })
})

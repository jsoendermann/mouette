import { Db } from 'mongodb'
import * as crypto from 'crypto'
import { IRule, IRuleFailure, RuleFailure, IRuleFailureJson, RuleSeverity, RuleGranularity } from '../abstractRule'
import { isPlural, pluralize } from '../vendor/lingo'
import * as colors from 'colors'
import { flatten, uniq } from 'lodash'

export const rule: IRule = {
  metadata: {
    name: 'no-leading-underscores-in-key-names',
    prettyName: 'No leading underscores in key names',
    description: "Make sure no key name except _id starts with an underscore.",
    rationale: "It suggests the data is used internally.",
    severity: 'warning' as RuleSeverity,
    granularity: 'key_name' as RuleGranularity,
    isFuzzy: false,
  },

  async apply(db: Db): Promise<IRuleFailure[]> {
    const collectionDetails = await db.listCollections({}).toArray()
    const userCollectionNames = collectionDetails
      .map(d => d.name)
      .filter(n => !n.startsWith('system.'))

    const failures: IRuleFailure[] = flatten(
      await Promise.all(userCollectionNames.map(async collectionName => {
        // console.log(collectionName)
        const allObjects = await db.collection(collectionName).find().toArray()
        const keyNames = uniq(flatten(allObjects.map(Object.keys)))
        return keyNames
          .filter(keyName => keyName !== '_id' && keyName[0] === '_')
          .map(keyName => new RuleFailure(this, collectionName, keyName))
      }))
    )

    return failures
  },

  failureToJson(failure: IRuleFailure): IRuleFailureJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string

    const result: any = {
      ruleName: this.metadata.name,
      prettyRuleName: this.metadata.prettyName,
      granularity: this.metadata.granularity,
      location: {
        collectionName,
        keyName,
      },
      isFuzzy: this.metadata.isFuzzy,
      severity: this.metadata.severity,
      failure: `Key name ${colors.bgYellow(colors.black(collectionName + '.' + keyName))} should not start with an underscore.`,
      hash: crypto.createHash('sha256').update(`${this.metadata.name}.${collectionName}`).digest('hex'),
    }

    if (keyName === '__v') {
      result.fix = "Configure mongoose so it doesn't create a __v key"
    }

    return result
  },
}
import { Db } from 'mongodb'
import * as crypto from 'crypto'
import { IRule, IRuleFailure, RuleFailure, IRuleFailureJson, RuleSeverity, RuleGranularity } from '../abstractRule'
import { isPlural, pluralize } from '../vendor/lingo'
import * as colors from 'colors'


export const rule: IRule = {
  metadata: {
    name: 'collection-names-number',
    prettyName: 'Collection names number',
    description: 'Make sure all collections in the database have names that are pluralized.',
    rationale: 'Reads more fluently.',
    severity: 'warning' as RuleSeverity,
    granularity: 'collection_name' as RuleGranularity,
    isFuzzy: false,
  },

  async apply(db: Db): Promise<IRuleFailure[]> {
    const collectionDetails = await db.listCollections({}).toArray()
    const userCollectionNames = collectionDetails
      .map(d => d.name)
      .filter(n => !n.startsWith('system.'))
    const nonPluralizedNames = userCollectionNames.filter(n => !isPlural(n))
    return nonPluralizedNames.map(n => new RuleFailure(this, n))
  },

  failureToJson(failure: IRuleFailure): IRuleFailureJson {
    const collectionName = failure.getCollectionName()
    if (collectionName === undefined) {
      throw new Error(`collectionName shouldn't be undefined for rule ${this.metadata.name}`)
    }

    return {
      ruleName: this.metadata.name,
      prettyRuleName: this.metadata.prettyName,
      granularity: this.metadata.granularity,
      location: {
        collectionName,
      },
      isFuzzy: this.metadata.isFuzzy,
      severity: this.metadata.severity,
      failure: `Collection name ${colors.bgYellow(colors.black(collectionName))} is not pluralized.`,
      fix: `Change ${collectionName} to ${pluralize(collectionName)}.`,
      hash: crypto.createHash('sha256').update(`${this.metadata.name}.${collectionName}`).digest('hex'),
    }
  },
}
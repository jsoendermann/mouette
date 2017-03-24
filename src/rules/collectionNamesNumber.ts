import { DbWrapper } from '../DbWrapper'
import { AbstractRule, IRuleFailure, IRuleFailureJson, RuleFailure,  RuleGranularity, RuleSeverity } from '../rule'
import { isPlural, pluralize } from '../vendor/lingo'


export class Rule extends AbstractRule {
  public static metadata = {
    name: 'collection-names-number',
    prettyName: 'Collection names number',
    description: 'Make sure all collections in the database have names that are pluralized.',
    rationale: 'Reads more fluently.',
    severity: 'warning' as RuleSeverity,
    granularity: 'collection_name' as RuleGranularity,
    isFuzzy: false,
    options: {

    },
  }

  public async apply(db: DbWrapper): Promise<IRuleFailure[]> {
    const collectionNames = await db.getCollectionNames()
    const nonPluralizedNames = collectionNames.filter(name => !isPlural(name))
    return nonPluralizedNames.map(name => new RuleFailure(this, name))
  }

  public failureToJson(failure: IRuleFailure): IRuleFailureJson {
    const collectionName = failure.getCollectionName() as string

    return {
      ruleMetadata: Rule.metadata,
      location: {
        collectionName,
      },
      failure: `Collection name **${collectionName}** is not pluralized.`,
      suggestion: `Change *${collectionName}* to *${pluralize(collectionName)}*.`,
    }
  }
}

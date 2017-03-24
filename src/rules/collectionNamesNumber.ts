import { DbWrapper } from '../DbWrapper'
import {
  AbstractRule,
  IRuleFailure,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
  RuleSeverity,
} from '../rule'
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

  public getMetadata() { return Rule.metadata }

  public async apply(dbWrapper: DbWrapper): Promise<IRuleFailure[]> {
    const collectionNames = await dbWrapper.getCollectionNames()
    const nonPluralizedNames = collectionNames.filter(name => !isPlural(name))
    return nonPluralizedNames.map(name => new RuleFailure(this, name))
  }

  public failureSpecificJson(failure: IRuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string

    return {
      location: {
        collectionName,
      },
      failure: `Collection name **${collectionName}** is not pluralized.`,
      suggestion: `Change *${collectionName}* to *${pluralize(collectionName)}*.`,
    }
  }
}

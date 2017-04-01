import { IDb } from '../db'
import {
  AbstractKeyRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


export class Rule extends AbstractKeyRule {
  public static metadata = {
    name: 'no-mixed-types',
    prettyName: 'No mixed types',
    description: 'Makes sure columns contain values of no more than one type.',
    rationale: 'Mixing types breaks expectations.',
    granularity: RuleGranularity.Column,
    isFuzzy: false,
    optionsDescription: '',
    optionsSchema: {},
  }

  protected getMetadata() { return Rule.metadata }

  protected async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure[]> {
    const types = await db.getTypesOfKeyInCollection(collectionName, keyName)
    const typesWithoutNullAndUndefined = types.filter(t => t !== 'missing' && t !== 'null')
    if (typesWithoutNullAndUndefined.length > 1) {
      return [new RuleFailure(
        this,
        {
          collectionName,
          keyName,
          additionalDetails: {
            types,
          },
        },
      )]
    }
    return []
  }

  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    const collectionName = failure.getCollectionName() as string
    const keyName = failure.getKeyName() as string
    const { types } = failure.getAdditionalDetails()

    return {
      failure: `Column **${collectionName}.${keyName}** contains mixed types: [${types.sort().join(', ')}]`,
    }
  }
}

import * as Joi from 'joi'
import { IDb } from './db'
import { flatten } from 'lodash'

export enum RuleSeverity {
  Warning,
  Error,
}

export enum RuleGranularity {
  CollectionName,
  KeyName,
  Column,
}

export interface IRuleMetadata {
  name: string
  prettyName: string
  description: string
  rationale: string
  severity: RuleSeverity
  granularity: RuleGranularity
  isFuzzy: boolean
  optionsDescription: string
  optionsSchema: { [key: string]: Joi.Schema }
}

export interface IRuleMetadataJson {
  name: string
  prettyName: string
  description: string
  rationale: string
  severity: string
  granularity: string
  isFuzzy: boolean
}

export interface IRuleFailureSpecificJson {
  failure: string
  suggestion?: string
  mongoCommand?: string
}

export interface IRuleFailureLocation {
  collectionName?: string
  keyName?: string
}

export interface IRuleFailureJson extends IRuleFailureSpecificJson {
  ruleMetadata: IRuleMetadataJson
  location: IRuleFailureLocation
}

export abstract class AbstractRule {
  constructor(protected options: any) {
    const { optionsSchema } = this.getMetadata()
    const joiSchema = Joi.object().keys({
      ...optionsSchema,
    })
    const validationResult = Joi.validate(options, joiSchema)
    if (validationResult.error) {
      throw validationResult.error
    }
  }

  public abstract getMetadata(): IRuleMetadata

  public abstract async apply(db: IDb): Promise<RuleFailure[]>

  public failureToJson(failure: RuleFailure): IRuleFailureJson {
    const location: IRuleFailureLocation = {}

    const collectionName = failure.getCollectionName()
    const keyName = failure.getKeyName()

    if (collectionName) {
      location.collectionName = collectionName
    }
    if (keyName) {
      location.keyName = keyName
    }

    const ruleMetadata = this.getMetadata()
    const ruleMetadataJson: IRuleMetadataJson = {
      name: ruleMetadata.name,
      prettyName: ruleMetadata.prettyName,
      description: ruleMetadata.description,
      rationale: ruleMetadata.rationale,
      severity: RuleSeverity[ruleMetadata.severity],
      granularity: RuleGranularity[ruleMetadata.granularity],
      isFuzzy: ruleMetadata.isFuzzy,
    }

    return {
      ruleMetadata: ruleMetadataJson,
      location,
      ...this.failureSpecificJson(failure),
    }
  }

  protected abstract failureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson
}

export abstract class AbstractCollectionRule extends AbstractRule {
  public async apply(db: IDb): Promise<RuleFailure[]> {
    const collectionNames = await db.getCollectionNames()
    const failureOptions = await Promise.all(collectionNames.map(c => this.applyForCollection(db, c)))
    const failures = failureOptions.filter(f => !!f).map(f => f!)
    return failures
  }

  public abstract async applyForCollection(db: IDb, collectionName: string): Promise<RuleFailure | null>
}

export abstract class AbstractKeyRule extends AbstractRule {
  public async apply(db: IDb): Promise<RuleFailure[]> {
    const getFailuresForCollection = async (collectionName: string) => {
      const keyNames = await db.getKeysInCollection(collectionName)
      const failureOptions = await Promise.all(keyNames.map(keyName => (
        this.applyForCollectionAndKey(db, collectionName, keyName)
      )))
      const failures = failureOptions.filter(f => !!f).map(f => f!)
      return failures
    }

    const collectionNames = await db.getCollectionNames()
    const failuresForCollections = await Promise.all(collectionNames.map(getFailuresForCollection))
    return flatten(failuresForCollections)
  }

  public abstract async applyForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure | null>
}

export class RuleFailure {
  constructor(private rule: AbstractRule,
              private collectionName?: string,
              private keyName?: string) { }

  public toJson(): IRuleFailureJson {
    return this.rule.failureToJson(this)
  }

  public getCollectionName(): string | undefined {
    return this.collectionName
  }

  public getKeyName(): string | undefined {
    return this.keyName
  }
}

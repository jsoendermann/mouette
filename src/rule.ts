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
  options: IRuleOptions
  location: IRuleFailureLocation
}

export interface IRuleOptions {
  severity: 'warning' | 'error'
  // Even though this is typed 'any', we know it's Json convertible
  // because these options get loaded from toml/yaml/json files.
  ; [ k: string ]: any
}

export abstract class AbstractRule {
  protected options: IRuleOptions

  constructor(untypedOptions: any) {
    const { optionsSchema } = this.getMetadata()
    const joiSchema = Joi.object().keys({
      severity: Joi.any().allow(['warning', 'error']).required(),
      ...optionsSchema,
    })
    const validationResult = Joi.validate(untypedOptions, joiSchema)
    if (validationResult.error) {
      throw validationResult.error
    }
    this.options = untypedOptions as IRuleOptions
  }

  public abstract getMetadata(): IRuleMetadata

  public abstract async getFailures(db: IDb): Promise<RuleFailure[]>

  public getJsonForFailure(failure: RuleFailure): IRuleFailureJson {
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
      granularity: RuleGranularity[ruleMetadata.granularity],
      isFuzzy: ruleMetadata.isFuzzy,
    }

    return {
      ruleMetadata: ruleMetadataJson,
      options: this.options,
      location,
      ...this.getFailureSpecificJson(failure),
    }
  }

  protected abstract getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson
}

export abstract class AbstractCollectionRule extends AbstractRule {
  public async getFailures(db: IDb): Promise<RuleFailure[]> {
    const collectionNames = await db.getCollectionNames()
    const failureOptions = await Promise.all(collectionNames.map(c => this.getFailuresForCollection(db, c)))
    const failures = failureOptions.filter(f => !!f).map(f => f!)
    return failures
  }

  public abstract async getFailuresForCollection(db: IDb, collectionName: string): Promise<RuleFailure | null>
}

export abstract class AbstractKeyRule extends AbstractRule {
  public async getFailures(db: IDb): Promise<RuleFailure[]> {
    const getFailuresForCollection = async (collectionName: string) => {
      const keyNames = await db.getKeysInCollection(collectionName)
      const failureOptions = await Promise.all(keyNames.map(keyName => (
        this.getFailuresForCollectionAndKey(db, collectionName, keyName)
      )))
      const failures = failureOptions.filter(f => !!f).map(f => f!)
      return failures
    }

    const collectionNames = await db.getCollectionNames()
    const failuresForCollections = await Promise.all(collectionNames.map(getFailuresForCollection))
    return flatten(failuresForCollections)
  }

  public abstract async getFailuresForCollectionAndKey(
    db: IDb,
    collectionName: string,
    keyName: string,
  ): Promise<RuleFailure | null>
}

export interface IRuleFailureConstructorOptions {
  collectionName?: string
  keyName?: string
  additionalDetails?: any
}

export class RuleFailure {
  constructor(private rule: AbstractRule,
              private options: IRuleFailureConstructorOptions) { }

  public toJson(): IRuleFailureJson {
    return this.rule.getJsonForFailure(this)
  }

  public getCollectionName(): string | undefined {
    return this.options.collectionName
  }

  public getKeyName(): string | undefined {
    return this.options.keyName
  }

  public getAdditionalDetails(): any | undefined {
    return this.options.additionalDetails
  }
}

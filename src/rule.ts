import * as Joi from 'joi'
import { DbWrapper } from './DbWrapper'

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

interface IRuleFailureLocation {
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

  public abstract async apply(dbWrapper: DbWrapper): Promise<IRuleFailure[]>

  public failureToJson(failure: IRuleFailure): IRuleFailureJson {
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

  protected abstract failureSpecificJson(failure: IRuleFailure): IRuleFailureSpecificJson
}

export interface IRuleFailure {
  toJson(): IRuleFailureJson
  getCollectionName(): string | undefined
  getKeyName(): string | undefined
}

export class RuleFailure implements IRuleFailure {
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

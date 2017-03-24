import { DbWrapper } from './DbWrapper'


export type RuleSeverity = 'warning' | 'error'
export type RuleGranularity = 'collection_name' | 'key_name' | 'column'

export interface IRuleMetadata {
  name: string
  prettyName: string
  description: string
  rationale: string
  severity: RuleSeverity
  granularity: RuleGranularity
  isFuzzy: boolean
}

export interface IRuleFailureSpecificJson {
  location: {
    collectionName?: string,
    keyName?: string,
  }
  failure: string
  suggestion?: string
  mongoCommand?: string
}

export interface IRuleFailureJson extends IRuleFailureSpecificJson {
  ruleMetadata: IRuleMetadata
}

export abstract class AbstractRule {
  public abstract getMetadata(): IRuleMetadata

  public abstract async apply(dbWrapper: DbWrapper): Promise<IRuleFailure[]>

  public failureToJson(failure: IRuleFailure): IRuleFailureJson {
    return {
      ruleMetadata: this.getMetadata(),
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

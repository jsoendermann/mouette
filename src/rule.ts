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

export abstract class AbstractRule {
  public static metadata: IRuleMetadata

  public abstract async apply(dbWrapper: DbWrapper): Promise<IRuleFailure[]>
  public abstract failureToJson(failure: IRuleFailure): IRuleFailureJson
}

export interface IRuleFailureJson {
  ruleMetadata: IRuleMetadata
  location: {
    collectionName?: string,
    keyName?: string,
  }
  failure: string
  suggestion?: string
  mongoCommand?: string
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

import { Db } from 'mongodb'


export interface IRuleFailureJson {
  ruleName: string
  prettyRuleName: string
  granularity: string
  location: {
    collectionName?: string
    keyName?: string
    recordId?: string
  }
  isFuzzy: boolean
  severity: string
  failure: string
  fix?: string
  hash: string
}

export interface IRuleFailure {
  toJson(): IRuleFailureJson
  getCollectionName(): string | undefined
  getKeyName(): string | undefined
  getRecordId(): any | undefined
}

export class RuleFailure implements IRuleFailure {
  constructor(private rule: IRule,
              private collectionName?: string,
              private keyName?: string,
              private recordId?: any) { }
    
  public toJson(): IRuleFailureJson {
    return this.rule.failureToJson(this)
  }

  getCollectionName(): string | undefined {
    return this.collectionName
  }

  getKeyName(): string | undefined {
    return this.keyName
  }

  getRecordId(): any | undefined {
    return this.recordId
  }
}

export type RuleSeverity = 'warning' | 'error'
export type RuleGranularity = 'collection_name' | 'key_name' | 'column' | 'row'

export interface IRuleMetadata {
  name: string
  prettyName: string
  description: string
  rationale: string
  severity: RuleSeverity
  granularity: RuleGranularity
  isFuzzy: boolean
}


export interface IRule {
  readonly metadata: IRuleMetadata
  apply(db: Db): Promise<IRuleFailure[]>
  failureToJson(failure: IRuleFailure): IRuleFailureJson
}

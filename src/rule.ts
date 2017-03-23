import { DbWrapper } from './DbWrapper'


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
  apply(db: DbWrapper): Promise<IRuleFailure[]>
  failureToJson(failure: IRuleFailure): IRuleFailureJson
}

export abstract class AbstractRule implements IRule {
  public static metadata: IRuleMetadata

  public abstract async apply(db: DbWrapper): Promise<IRuleFailure[]>
  public abstract failureToJson(failure: IRuleFailure): IRuleFailureJson
}

export interface IRuleFailureJson {
  ruleMetadata: IRuleMetadata
  location: {
    collectionName?: string
    keyName?: string
    recordId?: string
  }
  fieldValue?: string
  fieldType?: string
  failure: string
  suggestion?: string
}

export interface IRuleFailure {
  toJson(): IRuleFailureJson
  getCollectionName(): string | undefined
  getKeyName(): string | undefined
  getRecordId(): string | undefined
  getFieldValue(): string | undefined
  getFieldType(): string | undefined
}

export class RuleFailure implements IRuleFailure {
  constructor(private rule: IRule,
              private collectionName?: string,
              private keyName?: string,
              private recordId?: string,
              private fieldValue?: string,
              private fieldType?: string) { }
    
  public toJson(): IRuleFailureJson {
    return this.rule.failureToJson(this)
  }

  getCollectionName(): string | undefined {
    return this.collectionName
  }

  getKeyName(): string | undefined {
    return this.keyName
  }

  getRecordId(): string | undefined {
    return this.recordId
  }

  getFieldValue(): string | undefined {
    return this.fieldValue
  }

  getFieldType(): string | undefined {
    return this.fieldType
  }
}

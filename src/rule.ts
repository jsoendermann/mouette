export type Violation = object
export interface Document {
  _id: string
  [field: string]: any
}

export abstract class Rule {
  private violations: Violation[] = []

  public getViolations(): Violation[] {
    return this.violations
  }

  public abstract feedDocument(doc: any): void

  protected abstract getViolationsInObject(object: object): void
}

export abstract class FieldNameRule {

}

export abstract class ValueRule {

}
import * as Joi from 'joi'

import { IDb } from '../db'
import {
  AbstractRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
  RuleSeverity,
} from '../rule'


// Don't change the name of this class
export class Rule extends AbstractRule {
  public static metadata = {
    name: 'my-new-rule', // The name of your rule in kebab case.
    prettyName: 'My new rule', // A readable version of the name.
    // A description of what your rule does.
    description: 'Makes sure collections collect.',
    // A justification for why it exists.
    rationale: 'Because we say so.',
    // See rule.ts for possible values. What your rule operates on.
    severity: RuleSeverity.Warning,
    // What your rule operates on.
    granularity: RuleGranularity.CollectionName,
    // Whether any guessing is involved in your rule.
    isFuzzy: false,
    // A string that contains a toml-encoded object with the options
    // to your rule. Possible types are: boolean, string, number,
    // enum (add a 'possibleValues' field), regexp. Arrays and
    // maybe objects might be added later, if you need them,
    // create an issue on github
    optionsDescription: `
      [my-first-option]
        description = "The first option."
        type = "enum"
        possibleValues = "'one' | 'two'"
      [my-second-option]
        description = "The second option."
        type = "boolean"
      [my-third-option]
        description = "The third option."
        type = "regexp"
    `,
    // A joi schema of your options. Make sure all options are required.
    optionsSchema: {
      'my-first-option': Joi.any().allow(['one', 'two']).required(),
      'my-second-option': Joi.bool().required(),
      'my-third-option': Joi.string().required(), // regexps are strings
    },
  }

  public getMetadata() { return Rule.metadata }

  // This method takes an IDb object and returns an array with all the
  // rule violations in the database. You can access your options as
  // this.options['my-first-option']. If you need to execute any db
  // operations that are not yet part of the IDb interface, you need to
  // add it in db.ts. RuleFailures are constructed like so:
  // new RuleFailure(
  //   this,
  //   collectionName, // If your rule operates on collections
  //   keyName, // If it also operates on keys or columns
  // )
  public async apply(db: IDb): Promise<RuleFailure[]> {
    return []
  }

  // This method takes a RuleFailure and returns a JSON convertible object with:
  // - a 'failure' property that describes the rule violation that occurred
  //   e.g. 'Collection name cow is not pluralized.'
  // - (optionally) a 'suggestion' property that suggests a fix to the problem
  //   e.g. 'Change cow to cows.'
  // - (optionally) a 'mongoCommand' property that contains a string ready to
  //   be executed on the user's MongoDB that shows him all the records that
  //   violate this rule. MAKE SURE RUNNING THIS COMMAND DOES NOT ALTER The
  //   CONTENTS OF THE DATABASE IN ANY WAY!
  public failureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    // const collectionName = failure.getCollectionName() as string

    return {
      failure: 'NOT YET IMPLEMENTED',
    }
  }
}

import * as Joi from 'joi'

import { IDb } from '../db'
import {
  AbstractCollectionRule,
  IRuleFailureSpecificJson,
  RuleFailure,
  RuleGranularity,
} from '../rule'


// You should either inherit from AbstractCollectionRule or AbstractKeyRule,
// depending on whether your rule needs just the collection name or both
// the collection name and the name of a key on the collection to run.
// Also, please don't change the name from "Rule" to anything else.
export class Rule extends AbstractCollectionRule {
  public static metadata = {
    // The name of your rule in kebab case.
    name: 'my-new-rule',
    // A readable version of the name.
    prettyName: 'My new rule',
    // A description of what your rule does.
    description: 'Makes sure collections collect.',
    // A justification for why it exists.
    rationale: 'Because we say so.',
    // What your rule operates on. Usually, this will correspond to the
    // superclass you are inheriting from but if you are using map reduce
    // to loop over keys, you might want to inherit from AbstractCollectionRule
    // and still set this to RuleGranularity.KeyName or RuleGranularity.Column.
    granularity: RuleGranularity.CollectionName,
    // Whether any guessing is involved in your rule. This applies
    // only to the rule itself, not to the suggestions it makes.
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

  protected getMetadata() { return Rule.metadata }

  // This is the body of your rule class that looks for violations.
  // You can access your options as this.options['my-first-option'].
  // If you need to execute any db operations that are not yet part of
  // the IDb interface, you need to add them in db.ts.
  public async getFailuresForCollection(
    db: IDb,
    collectionName: string,
  ): Promise<RuleFailure[]> {
    // RuleFailures are constructed like so:
    // new RuleFailure(
    //   this,
    //   {
    //     collectionName, // If your rule operates on collections
    //     keyName, // If it also operates on keys or columns
    //     additionalDetails, // Anything you need in getFailureSpecificJson
    //   },
    // )
    return []
  }

  // This method takes a RuleFailure and returns a JSON convertible object with:
  // - a 'failure' property that describes the rule violation that occurred
  //   e.g. 'Collection name cow is not pluralized.'
  // - (optionally) a 'suggestion' property that suggests a fix to the problem
  //   e.g. 'Change cow to cows.' This suggestion should add value beyond just
  //   saying "Don't break this rule". If no meaningful suggestion can be made,
  //   it's better to leave this undefined.
  // - (optionally) a 'mongoCommand' property that contains a string ready to
  //   be executed on the user's MongoDB that shows him all the records that
  //   violate this rule. MAKE SURE RUNNING THIS COMMAND DOES NOT ALTER THE
  //   CONTENTS OF THE DATABASE IN ANY WAY!
  public getFailureSpecificJson(failure: RuleFailure): IRuleFailureSpecificJson {
    // const collectionName = failure.getCollectionName() as string

    return {
      failure: 'NOT YET IMPLEMENTED',
    }
  }
}

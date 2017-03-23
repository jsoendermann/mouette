import { DbWrapper } from './DbWrapper'
import {
  Rule as CollectionNamesNumberRule
} from './rules/collectionNamesNumber'
import {
  Rule as NoLeadingUnderscoresInKeyNamesRule
} from './rules/noLeadingUnderscoresInKeyNames'
import { IRuleFailure, IRuleFailureJson } from './rule'
import { flatten } from 'lodash'
import { commandLineFormatter } from './formatters'

require('dotenv').config()


const dbWrapper = new DbWrapper(process.env.MONGODB_URL);

(async () => {
  const failures = flatten([
    ...await new CollectionNamesNumberRule().apply(dbWrapper),
    ...await new NoLeadingUnderscoresInKeyNamesRule().apply(dbWrapper),
  ])

  const output = commandLineFormatter(failures.map(f => f.toJson()))
  console.log(output)
  dbWrapper.close()
})()

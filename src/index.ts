import { DbWrapper } from './DbWrapper'
import {
  Rule as r1
} from './rules/collectionNamesNumber'
import {
  Rule as r2
} from './rules/noLeadingUnderscoresInKeyNames'
import { IRuleFailure, IRuleFailureJson } from './abstractRule'
require('dotenv').config()
import * as colors from 'colors'


const dbWrapper = new DbWrapper(process.env.MONGODB_URL);

(async () => {
  const failures1 = await new r1().apply(dbWrapper)
  const failures2 = await new r2().apply(dbWrapper)
  console.log(failures1.map(f => f.toJson()))
  console.log(failures2.map(f => f.toJson()))
  dbWrapper.close()
})()

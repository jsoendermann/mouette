import { MongoClient, Db } from 'mongodb'
import {
  rule as r1
} from './rules/collectionNamesNumber'
import {
  rule as r2
} from './rules/noLeadingUnderscoresInKeyNames'
import { IRuleFailure, IRuleFailureJson } from './abstractRule'
require('dotenv').config()
import * as colors from 'colors'


const print = (failure: IRuleFailure) => {
  const json = failure.toJson()
  console.log(
    `${colors.yellow(json.failure)
    }${json.fix ? `\nYou could... ${json.fix}` : ''}\n`
  )

}

// MongoClient.connect('mongodb://localhost:27017/seagull_dev').then(async (db: Db) => {
MongoClient.connect(process.env.MONGODB_URL).then(async (db: Db) => {
  // if db == null, on('error'/'close')
  console.log('Connected')

  const failures1 = await r1.apply(db)
  const failures2 = await r2.apply(db)
  // console.log(1)
  failures1.map(print)
  failures2.map(print)
  db.close()
})
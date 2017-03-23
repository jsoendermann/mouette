// import { DbWrapper } from '../DbWrapper'
// import { IRule, IRuleFailure, RuleFailure, IRuleFailureJson, RuleSeverity, RuleGranularity, AbstractRule } from '../rule'
// import { isPlural, pluralize } from '../vendor/lingo'
// import { flatten } from 'lodash'


// export class Rule extends AbstractRule {
//   public static metadata = {
//     name: 'keys-that-en-in-at-should-contain-dates',
//     prettyName: 'Keys that end in At should contain dates',
//     description: "Make sure columns with keys that end in ...At contain nothing but dates.",
//     rationale: "It's what people expect when they see names like updatedAt.",
//     severity: 'error' as RuleSeverity,
//     granularity: 'column' as RuleGranularity,
//     isFuzzy: false,
//   }

//   async apply(db: DbWrapper): Promise<IRuleFailure[]> {
//     const collectionNames = await db.getCollectionNames()

//     const failures: IRuleFailure[] = flatten(
//       await Promise.all(collectionNames.map(async collectionName => {
//         const keyNames = await db.getKeysInCollection(collectionName)
//         const keyNamesThatEndInAt = keyNames.filter(keyName => keyName.endsWith('At'))

//         return flatten(
//           await Promise.all(keyNamesThatEndInAt.map(async keyName => {
//             const rawDb = await db.getDb()
//             const objectsThatArentDates = await rawDb.collection(collectionName).find(
//               {
//                 [keyName]: {
//                     $exists: 1,
//                     $not: { $or: [{ $type: 9 }, { $type: 10 }] }
//                 },
//               }
//             ).toArray()

//             return objectsThatArentDates.map(obj => new RuleFailure(
//               this,
//               collectionName,
//               keyName,
//               obj._id.toString(),
//               JSON.stringify(obj[keyName]),
//               typeof obj[keyName],
//             ))
//           }))
//         )
//       }))
//     )

//     return failures
//   }

//   failureToJson(failure: IRuleFailure): IRuleFailureJson {
//     const collectionName = failure.getCollectionName() as string
//     const keyName = failure.getKeyName() as string
//     const recordId = failure.getRecordId() as string
//     const fieldValue = failure.getFieldValue() as string
//     const fieldType = failure.getFieldType() as string

//     const result: any = {
//       ruleMetadata: Rule.metadata,
//       location: {
//         collectionName,
//         keyName,
//         recordId,
//       },
//       fieldValue,
//       fieldType,
//       failure: `Record **${collectionName}.${keyName}.${recordId}** should be of type date.`,
//     }

//     return result
//   }
// }

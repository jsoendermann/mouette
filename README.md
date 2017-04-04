# Mouette

Mouette is a linter for your MongoDB.

## Try it

```shell
yarn global add mouette
mouette lint -s summary mongodb://...
mouette lint mongodb://...
```

To see all functions, run `mouette --help`

## Rules

- [X] **Collection names camel/snake case**: Make sure all collection names in the database have the right case.
  * *case*: The case your collection names should be in.
- [X] **Collection names singular/plural**: Make sure all collections in the database have names that are either singular or plural.
  * *number*: The grammatical number that collection names should be checked for.
- [X] **Key names singular/plural**: Make sure all keys in the database have the right case.
  * *case*: The case your keys should be in.
- [X] **Keys that end in At should refer to dates**: Make sure columns with keys that end in ...At contain nothing but dates.
  * *allow-stringified-days*: Whether to allow dates that are saved as strings.
  * *stringified-days-regex*: The regexp used to determine whether a string contains a date.
- [X] **Max key count**: Enforces a maximum number of keys per collection.
  * *maximum-excluding-_id*: The maximum number of keys allowed.
- [X] **No bad key names**: Make sure no common bad key names are used.
  * *names-considered-bad*: Key names that should be avoided.
- [X] **No dates saved as string**: Makes sure dates don't get saved as strings.
- [X] **No leading underscores in key names**: Make sure no key name except _id starts with an underscore.
- [X] **No mixed types**: Makes sure columns contain values of no more than one type.
- [ ] **No null**: Make sure columns do not contain null values.
- [X] **No numbers saved as string**: Makes sure numbers don't get saved as strings.
  * *strict-number-check*: When this is set to true, strings like '015', '0xF' or '0b1111 are not considered to be numbers.
- [ ] **No undefined**: Make sure columns do not contain undefined values.
- [X] **Question keys should refer to booleans**: Make sure columns with keys that start with verbs like "is" or "has" contain nothing but booleans.
  * *boolean-key-prefixes*: Which prefixes should indicate booleans.

## Features

- Completely schemaless, mouette needs no information about your db to run.
- Suggests fixes when possible
- Prints queries ready to be pasted into the MongoDB shell that print all the documents that need fixing
- Includes a diffing function that can be used to find all rule violations that were added since your last lint

## Develop

```shell
git clone https://github.com/jsoendermann/mouette/
cd mouette
yarn
npm run watch
node dist/bin/mouette.js lint <your mongodb://...>
```

## Add a new rule

1. Copy `src/rules/_RULE_TEMPLATE.ts` to a new file in the `src/rules/` folder.
2. Follow the instructions in that file to implement your rule.
3. Add default options for your new rule to `defaultConfig.toml`.
4. Write tests and add them to the `__tests__/rules/` folder.
5. Send me a pull request and share your new rule with the world.

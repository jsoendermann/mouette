# Mouette

Mouette is a linter for your MongoDB.

## Try it out

TODO: Make this work
```shell
yarn global add mouette
mouette
```

## Rules

- **Collection names case**: Make sure all collection names in the database have the right case.
  * *case*: The case your collection names should be in.
- **Collection names number**: Make sure all collections in the database have names that are pluralized.
  * *number*: The grammatical number that collection names should be checked for.
- **Key names case**: Make sure all keys in the database have the right case.
  * *case*: The case your keys should be in.
- **Keys that end in At should refer to dates**: Make sure columns with keys that end in ...At contain nothing but dates.
  * *allow-stringified-days*: Whether to allow dates that are saved as strings.
  * *stringified-days-regex*: The regexp used to determine whether a string contains a date.
- **Max key count**: Enforces a maximum number of keys per collection.
  * *maximum-excluding-_id*: The maximum number of keys allowed.
- **No bad key names**: Make sure no common bad key names are used.
  * *names-considered-bad*: Key names that should be avoided.
- **No dates saved as string**: Makes sure dates don't get saved as strings.
- **No leading underscores in key names**: Make sure no key name except _id starts with an underscore.
- **No mixed types**: Makes sure columns contain values of no more than one type.
- **No null**: Make sure columns do not contain null values.
- **No numbers saved as string**: Makes sure numbers don't get saved as strings.
  * *strict-number-check*: When this is set to true, strings like '015', '0xF' or '0b1111 are ignored.
- **No undefined**: Make sure columns do not contain undefined values.
- **Question keys should refer to booleans**: Make sure columns with keys that start with verbs like "is" or "has" contain nothing but booleans.
  * *boolean-key-prefixes*: Which prefixes should indicate booleans.

## Develop

```shell
git clone https://github.com/jsoendermann/mouette/
cd mouette
yarn
yarn watch
node dist/bin/mouette.js lint <your mongodb://...>
```

## Adding a new rule

1. Copy `src/rules/_RULE_TEMPLATE.ts` to a new file in the `src/rules/` folder.
2. Follow the instructions in that file to implement your rule.
3. Add default options for your new rule to `defaultConfig.toml`.
4. Write tests and add them to the `__tests__/rules/` folder.
5. Send me a pull request and share your new rule with the world.

## TODO

- [ ] Comment code
- [ ] Complete test coverage
- [ ] Add a summary switch to argument parser
# Mouette

Mouette is a linter for your MongoDB.

## Try it out

TODO

## Features

TODO

## How is this supposed to be used?

TODO

## Develop

```shell
git clone https://github.com/jsoendermann/mouette/
cd mouette
yarn install
npm run watch
node dist/bin/mouette.js
```

## Adding a new rule

1. Copy `src/rules/_RULE_TEMPLATE.ts` to a new file in the `src/rules/` folder.
2. Follow the instructions in that file to implement your rule.
3. Add default options for your new rule to `defaultConfig.toml`.
4. Write tests and add them to the `__tests__/rules/` folder.
5. Send me a pull request and share your new rule with the world.

## TODO

- [ ] Add tests
  - [ ] Coverage
  - [ ] CI
- [ ] Comment code
- [ ] Web interface
  - [ ] Dockerize
- [ ] Come up with a way to lint nested objects


## Rules

- [X] collection-names-number
- [X] keys-that-end-in-at-should-refer-to-dates
- [X] no-leading-underscores-in-key-names
- [X] key-names-case
- [ ] no-mixed-types
- [ ] no-undefined
- [ ] no-null
- [ ] is-and-has-keys-should-refer-to-booleans
- [ ] max-key-count
  - [ ] count: 10
- [ ] bad-key-names
  - [ ] names-considered-bad: 'value' | 'data' | 'details'
- [ ] numbers-saved-as-strings
- [ ] columns-containing-object-ids-should-end-in-id

### Guesses

- [ ] enforce-enums
- [ ] no-number-enums
- [ ] save-days-in-string-when-possible

### Potentially slow

- [ ] dangling-foreign-keys
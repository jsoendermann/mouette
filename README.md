# Mouette

Mouette is a linter for your MongoDB.

## Features

TODO

## Install

TODO

## Develop

```shell
git clone https://github.com/jsoendermann/mouette/
cd mouette
yarn install
npm run watch
node dist/bin/mouette.js
```

## TODO

- [ ] Comment code
- [ ] Add tests (+coverage)
- [ ] Add template and instructions for new rules
- [ ] Come up with a way to lint nested objects
- [ ] CI
- [ ] Dockerize

## Rules

- [X] collection-names-number
- [X] keys-that-end-in-at-should-refer-to-dates
- [X] no-leading-underscores-in-key-names
- [ ] key-names-format
  - [ ] format: 'camel-case' | 'snake-case'
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
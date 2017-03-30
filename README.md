# Mouette

Mouette is a linter for your MongoDB.

## Try it out

TODO

## Features

TODO


## Develop

```shell
git clone https://github.com/jsoendermann/mouette/
cd mouette
yarn install
yarn watch
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
- [ ] Comment code

- [ ] Come up with a way to lint nested objects
- [ ] CI
  - [ ] Coverage


### Rules

- [ ] columns-containing-dates-should-end-in-at
- [ ] columns-containing-bools-should-end-in-is-or-has
- [ ] no-dates-saved-as-string
- [ ] no-mixed-types
- [ ] columns-containing-object-ids-should-end-in-id
- [ ] columns-containing-string-ids-should-end-in-id
- [ ] no-deep-object-nesting

### Guesses

- [ ] enforce-enums
- [ ] no-number-enums
- [ ] save-days-in-string-when-possible

### Potentially slow

- [ ] dangling-foreign-keys

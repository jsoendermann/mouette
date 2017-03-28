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


### Rules

- [ ] no-mixed-types
- [ ] columns-containing-object-ids-should-end-in-id

### Guesses

- [ ] enforce-enums
- [ ] no-number-enums
- [ ] save-days-in-string-when-possible

### Potentially slow

- [ ] dangling-foreign-keys

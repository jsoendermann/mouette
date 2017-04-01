# Mouette

Mouette is a linter for your MongoDB.

## Try it out

TODO: Make this work
```shell
yarn global add mouette
mouette
```

## Rules

TODO

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
- [ ] Document rules
- [ ] Complete test coverage
- [ ] Add a summary switch to argument parser
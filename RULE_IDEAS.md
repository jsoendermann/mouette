# Rule ideas

- collection-names-number
  - number: 'singular' | 'plural'
- key-names-format
  - format: 'camel-case' | 'snake-case'
- no-leading-underscores-in-key-names
- no-mixed-types
- no-undefined
- no-null
- keys-that-end-in-at-should-contain-dates
  - allow-stringified-days: bool
- is-and-has-keys-should-contain-booleans
- max-key-count
  - count: 10
- bad-key-names
  - names-considered-bad: 'value' | 'data' | 'details'
- numbers-saved-as-strings
- columns-containing-object-ids-should-end-in-id

## Guesses

- enforce-enums
- no-number-enums
- save-days-in-string-when-possible

## Potentially slow

- dangling-foreign-keys
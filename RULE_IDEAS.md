# Rule ideas

- Consistent pluralization of collection names
- check for camel case in collection/field names (also check for ID instead of Id at the end)
- make sure collection names are camelcase
- make sure key names are camelcase/snakecase

Find mixed types (strings and bools)
Dangling foreign keys
Find dates that should be ‘yyyy-mm-dd’
handle undefined
Suggest sub objects if there are too many properties
Make sure xxxAt is of type date, isXXX/hasXXX is of type bool
Check for common bad names like “value”
Check sub object schema




Mixed types (objectid / string)
Nested objects
Null/undefined
Dates that should be saved as strings
Dangling foreign keys
Enums
Numbers saved as strings
Empty strings




Remember which errors are new
Make disabling warning easy
Give it hints about schema, combine with disabling

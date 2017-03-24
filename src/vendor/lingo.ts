const lingo = require('lingo')


const customSingularPluralPairs = [
  { singular: 'photo', plural: 'photos' },
]
export const isPlural = (s: string) => {
  if (customSingularPluralPairs.find(c => c.plural === s)) {
    return true
  }
  return lingo.en.isPlural(s)
}

export const pluralize = (s: string): string => {
  const custom = customSingularPluralPairs.find(c => c.singular === s)
  if (custom) {
    return custom.plural
  }
  return lingo.en.pluralize(s)
}

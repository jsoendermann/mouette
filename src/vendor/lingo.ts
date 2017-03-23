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
  const c = customSingularPluralPairs.find(c => c.singular === s)
  if (c) {
    return c.plural
  }
  return lingo.en.pluralize(s)
}

const lingo = require('lingo')


const customSingularPluralPairs = [
  { singular: 'photo', plural: 'photos' },
  { singular: 'sms', plural: 'sms' },
]

export const isSingular = (s: string) => {
  if (customSingularPluralPairs.find(c => c.singular === s)) {
    return true
  }
  return lingo.en.isSingular(s)
}

export const isPlural = (s: string) => {
  if (customSingularPluralPairs.find(c => c.plural === s)) {
    return true
  }
  return lingo.en.isPlural(s)
}

export const singularize = (s: string): string => {
  const custom = customSingularPluralPairs.find(c => c.plural === s)
  if (custom) {
    return custom.singular
  }
  return lingo.en.singularize(s)
}

export const pluralize = (s: string): string => {
  const custom = customSingularPluralPairs.find(c => c.singular === s)
  if (custom) {
    return custom.plural
  }
  return lingo.en.pluralize(s)
}

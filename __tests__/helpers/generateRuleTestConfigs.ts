import { parse } from 'toml'
import * as product from 'cartesian-product'


export default (optionsDescriptionStr: string) => {
  const optionsDescription = parse(optionsDescriptionStr)
  const possibleValuesForOptions = []
  Object.keys(optionsDescription).forEach(key => {
    const type = optionsDescription[key].type
    switch (type) {
      case 'enum': {
        const enumRegexp = /'(.*?)'/g
        const possibleValuesStr = optionsDescription[key].possibleValues
        const possibleValues = []
        let match = enumRegexp.exec(possibleValuesStr)
        while (match !== null) {
          possibleValues.push(match[1])
          match = enumRegexp.exec(possibleValuesStr)
        }

        possibleValuesForOptions.push(
          possibleValues.map(value => ({ option: key, value })),
        )
        break
      }
      case 'boolean':
        possibleValuesForOptions.push([
          { option: key, value: false },
          { option: key, value: true },
        ])
        break
      default: throw new Error(`Can't generate test config for option ${key} of type ${type}`)
    }
  })
  const combinedOptions = product(possibleValuesForOptions)
  const mergedOptions = combinedOptions.map(individualOptions => {
    const obj = {}
    individualOptions.forEach(({ option, value }) => obj[option] = value)
    return obj
  })
  return mergedOptions
}

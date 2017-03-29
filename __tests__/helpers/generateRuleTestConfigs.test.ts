import generateRuleTestConfigs from './generateRuleTestConfigs'

describe('generateRuleTestConfig', () => {
  it('should work for enums', () => {
    const configs = generateRuleTestConfigs(`
      [option-1]
      description = "Blabla"
      type = "enum"
      possibleValues = "'foo' | 'bar' | 'arst'"
    `)
    expect(configs).toEqual([
      { 'option-1': 'foo' },
      { 'option-1': 'bar' },
      { 'option-1': 'arst' },
    ])
  })

  it('should work for bools', () => {
    const configs = generateRuleTestConfigs(`
      [option-1]
      description = "Blabla"
      type = "boolean"
    `)
    expect(configs).toEqual([
      { 'option-1': false },
      { 'option-1': true },
    ])
  })

  it('should work for multiple options', () => {
    const configs = generateRuleTestConfigs(`
      [option-1]
      description = "Blabla"
      type = "enum"
      possibleValues = "'foo' | 'bar'"
      [option-2]
      description = "Blabla"
      type = "boolean"
    `)
    expect(configs).toEqual([
      { 'option-1': 'foo', 'option-2': false },
      { 'option-1': 'foo', 'option-2': true },
      { 'option-1': 'bar', 'option-2': false },
      { 'option-1': 'bar', 'option-2': true },
    ])
  })

  it('should throw for other types', () => {
    expect(() => generateRuleTestConfigs(`
      [option-1]
      description = "Blabla"
      type = "number"
    `)).toThrow()
  })
})

const {baseBuilder} = require('../utils')

module.exports = baseBuilder(
  (key, value) => (
    `  ${key}: '${value}'`
  ),
  (data) => (
    `export default {\n${data.join(',\n')}\n};`
  )
)

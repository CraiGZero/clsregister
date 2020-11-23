const {baseBuilder} = require('../utils')

module.exports = baseBuilder(
  (key, value) => (
    `$${key}: '${value}';`
  ),
  (data) => (
    data.join('\n')
  )
)

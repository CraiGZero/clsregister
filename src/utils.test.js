const {fileTypeChecker} = require('./utils');

test('less fileType !== less', () => {
  expect(fileTypeChecker('less', 'less')).toBe(false);
});
test('a.less fileType === less', () => {
  expect(fileTypeChecker('a.less', 'less')).toBe(true);
});

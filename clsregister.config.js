// demo
const {fastRegister} = require('clsregister')
module.exports = {
  namespace: 'craig',
  className: {
    layout: {
      _children_: ['main', 'right'],
      _scopedChildren_: ['mains', 'rights'],
      nav: {},
      left: {
        _scoped_: true,
      },
    },
  },
  middlewares: [
    (ctx, next) => {
      const _ctx = ctx.register(
        'src/config/className',
        'cls.js',
        (key, value) => {
          return `  ${key}: '${value}'`;
        },
      );
      next();
      const data = `export default {\n${_ctx.getClassNames().join(',\n')}\n};`;
      _ctx.writeFile(data);
    },
    fastRegister.less('src/config/className','cjs.less'),
  ],
};

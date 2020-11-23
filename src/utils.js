const fs = require('fs');
const path = require('path');

const appDirectory = fs.realpathSync(process.cwd());

const resolveSrc = relativePath => path.resolve(appDirectory, relativePath);

function compose(middlewares) {
  if (!Array.isArray(middlewares)) throw new TypeError('Middlewares must be an array!');

  const middlewaresLen = middlewares.length;
  for (let i = 0; i < middlewaresLen; i++) {
    if (typeof middlewares[i] !== 'function') {
      throw new TypeError('Middleware must be componsed of function');
    }
  }

  return function wrapMiddlewares(params, next) {
    let index = -1;

    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() should not be called multiple times in one middleware!'));
      }
      index = i;
      const fn = middlewares[i] || next;
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(params, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}

function baseBuilder(handler, builder) {
  return function (path, filename) {
    return (ctx, next) => {
      const _ctx = ctx.register(
        path,
        filename,
        handler,
      );
      next();
      const data = builder(_ctx.getClassNames());
      _ctx.writeFile(data);
    }
  }
}

function fileTypeChecker(filename, type) {
  const reg = new RegExp(`.${type}$`)
  return reg.test(filename)
}

module.exports = {
  compose,
  resolveSrc,
  baseBuilder,
  fileTypeChecker
}

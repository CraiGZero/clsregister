const fs = require('fs');
const camelcase = require('camelcase');
const {compose, resolveSrc} = require('./utils');

const defaultConfig = require(resolveSrc('clsregister.config.js'));

const {namespace, className, middlewares} = defaultConfig;

class ClsContext {
  constructor(path, fileName, handler) {
    this.path = path
    this.fileName = fileName
    this.handler = handler
    this.classNames = []
  }

  getClassNames = () => {
    return this.classNames
  }
  /**
   * 读取filePath中的写入路径，并写入对应目录
   */
  writeFile = (data) => {
    const fileName = this.fileName
    const current = this.handler.get(fileName);
    const fullPath = resolveSrc(`${current.path}/${fileName}`);

    fs.writeFile(fullPath,
      data,
      {encoding: 'utf8'},
      err => {
        if (err) throw err;
        console.log(`${fileName} file generated successfully`);
      });
  };
  
  addClassName = (className) => {
    this.classNames.push(className)
  }
}

class ClsBuilder {
  constructor(namespace, className) {
    this.namespace = namespace;
    this.className = className;
    // 格式化以後的className
    this.formatedCls = [];
    // [function]
    // this.middlewares = new Map();
    this.middlewares = [];
    this.handler = new Map();
    // [[filename],[path]]
    this.filePath = [];
    this.formatConfig();
  }

  use(newMiddleware) {
    if (typeof newMiddleware !== 'function') throw new TypeError('middleware must be a function!');
    this.middlewares.push(newMiddleware);
  }

  formatConfig() {
    // cls集合,通过二维数组表示[[key,value]]
    const clsCollection = [];
    // 所有类名的集合，防止出现重复情况
    const clsPool = [];
    // 所有类名key的集合，防止出现重复情况
    const clsKeyPool = [];


    function clsInjection(key, value) {
      clsPool.push(value);
      clsKeyPool.push(key);
      clsCollection.push([key, value]);
    }

    // 通过区分scoped生成key值，
    const createClsKey = (scoped, key, parentsKey) => {
      return scoped ? camelcase(`${parentsKey}-${key}`) : key;
    };

    // 生成className
    const createCls = (key, parentsCls) => {
      return `${parentsCls}-${key}`;
    };

    // 将children转换为能够解析的对象
    const handleClsChildren = (clsInfo, {parentsKey, parentsCls}, scoped) => {
      const temp = {};
      clsInfo.forEach(v => {
        temp[v] = {};
        // 存在scoped时增加私有属性
        if (scoped) {
          temp[v]._scoped_ = scoped;
        }
      });
      handleItem(temp, {parentsKey, parentsCls});
    };

    const handleItem = (cls, {parentsKey, parentsCls}) => {
      for (const key in cls) {
        if (key === '_scoped_') {
          continue;
        }
        if (key === '_children_') {
          handleClsChildren(cls[key], {parentsKey, parentsCls});
          continue;
        }
        if (key === '_scopedChildren_') {
          handleClsChildren(cls[key], {parentsKey, parentsCls}, true);
          continue;
        }

        const _key = createClsKey(cls[key]._scoped_, key, parentsKey);
        const _cls = createCls(key, parentsCls);

        // 判断新key是否已存在
        if (clsKeyPool.includes(_key)) {
          throw new Error(`${_key}(生成自${key}) 已存在。`);
        }

        // 判断新value是否已存在
        if (clsPool.includes(cls[key])) {
          throw new Error(`${cls[key]} 已存在。`);
        }

        // 将生成好的cls注入到集合中
        clsInjection(_key, _cls);
        handleItem(cls[key], {parentsKey: _key, parentsCls: _cls});
      }
    };
    handleItem(this.className, {parentsCls: this.namespace});

    this.formatedCls = clsCollection;
  }

  midRegister = (path, fileName, handler) => {
    if (this.handler.has(fileName)) {
      throw new Error(`处理${fileName}文件的handler已存在！`);
    }
    const ctx = new ClsContext(path, fileName, handler)
    this.handler.set(fileName, ctx);
    return ctx
  };


  // 核心中间件，负责通过注册的handler处理formatedCls
  coreMiddlewares = (ctx, next) => {
    if (!ctx) return next();
    this.formatedCls.forEach((([key, value]) => {
      // 取出已注册的handler,每次遍历时，执行所有handler
      for (const mapKey of this.handler.keys()) {
        // 从当前注册的handler取出当前触发的
        const currentHandler = this.handler.get(mapKey);
        // 通过中间件注册的handler来处理每一项数据
        const singleClassName = currentHandler.handler(key, value);
        // 如果处理失败，则抛错
        if (typeof singleClassName !== 'string') {
          throw new Error(`${currentHandler.fileName}的handler应该返回‘string’类型,但是却返回了${typeof singleClassName}`);
        }
        currentHandler.addClassName(singleClassName);
      }
    }));
    next();
  };

  output = () => {
    const fn = compose([
      ...this.middlewares,
      this.coreMiddlewares,
    ]);
    return fn({
      register: this.midRegister,
    });
  };
}


const cls = new ClsBuilder(namespace, className);

middlewares.forEach(fn => {
  cls.use(fn);
});

cls.output();

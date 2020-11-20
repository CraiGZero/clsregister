# ClassName Register
 
通过配置来生成符合“姓氏命名法”的className对象。

##
请在项目根目录新增```clsregister.config.js```文件来进行配置。

## 配置内容

属性 | 类型 | 描述 |
--- | --- | --- | 
namespace | String | 顶层前缀，会添加在每个className顶层，主要为了做样式的命名空间隔离，防止污染。 | 
className | Object | 具体的配置项，采用嵌套结构来表示类的上下层关系 | 
middlewares | Function[] | 生成不同类型的文件，需要配置不同的中间件 | 

## className配置
 
私有属性 | 类型 | 描述 |
--- | --- | --- | 
```key``` | String | 对象的key，只要出现定义，就会注册至集合中。不允许出现重复值！ | 
```key._scoped_```   | Boolean  | 设置此属性为true，会自动与上级Key值进行拼接。 | 
```key._children_``` | String[] | 如需要注册的className不需要携带任何属性，可以挂载在此属性上。 | 
```key._scopedChildren_``` | String[] | 包含的所有className注册时都会携带_scoped_。 | 

## 🔨 示例

##### 基础定义
```jsx
module.exports = {
  namespace: 'craig',
  className: {
    layout: {},
  },
};
```
> 此时layout字段会被注册，并生成带有命名空间前缀的className
> 最终生成
```js
{
  layout:'craig-layout'
};
```

##### 嵌套组合
```jsx
module.exports = {
  namespace: 'craig',
  className: {
    layout: {
      nav: {}
    },
  },
};

```
> 此时layout与nav字段均会被注册，并生成带有命名空间前缀的className
> 最终生成
```js
 {
   layout:'craig-layout',
   nav:'craig-layout-nav'
 };
 ```

>如果担心nav容易与其他key值重复，可以添加```_scoped_```属性
```jsx
module.exports = {
  namespace: 'craig',
  className: {
    layout: {
      nav: {_scoped_:true}
    },
  },
};
```
> 最终生成
```js
 {
   layout:'craig-layout',
   layoutNav:'craig-layout-nav'
 };
 ```

> 按上述写法，如果key值较多，且都无子属性，则可以使用```_children_```和```_scopedChildren_```属性来简写

```jsx
module.exports = {
  namespace: 'craig',
  className: {
    layout: {
      _children_:['title','sider'],
      _scopedChildren_:['nav','center'],
      main:{
        logo:{},
        button:{_scoped_:true}   
      }   
    },
  },
};
```
> 最终生成
```js
 {
   layout:'craig-layout',
   title:'craig-title',
   sider:'craig-sider',
   layoutNav:'craig-layout-nav',
   layoutCenter:'craig-layout-center',
   main:'craig-layout-main',
   logo:'craig-layout-main-logo',
   mainButton:'craig-layout-main-button',
 };
 ```

## middlewares配置

## 🔨 示例

>middlewares的每一个元素都必须是一个函数，函数会接受到一个ctx对象和一个next函数

##### ctx对象包含属性
属性 |  类型 | 接收参数| 描述 |
--- | --- | --- |  --- | 
register | Function | path:string,filename:sting,handler:function |会返回当前注册成功的实例 | 
getClassNames | Function | -- | 根据注册在register上的handler，返回string[]。可以请根据自己需求，组合成符合需求的数据。 | 
writeFile | Function | data:string | 会根据传入参数，执行写入操作。文件最终会生成在注册时填写的目录中。 |
 
##### register入参解释
参数 |  类型 | 描述 |
--- | --- | --- |  
path | String | 写入配置的目标路径，以当前根目录（process.cwd()）为起点 | 
filename | String | 文件名 ，如出现同名文件会被覆盖，注册前请确认。| 
handler | Function |  处理配置文件过程中，会将配置中的classNames拆分成数组，数组长度为所有注册的keys + 所有children。
该函数类似于Array.prototype.map方法。接收key与value，用户可以根据自己的实际应用场景，来决定返回什么样的字符串。最终会根据handler生成对应的ClassNames，可以通过当前注册实例上的getClassNames获取到。
 |
 
##### next方法
>注册成功后，需要调用```next()```来告知处理器向下执行。 直至执行到最后一个中间件。全部中间件执行完成以后，会将所需数据挂载至对应实例上。
>所以需要在next()方法调用后再写数据处理逻辑，否则是获取不到对应数据的。

##### 使用方法
```jsx
(ctx, next) => {
  const _ctx = ctx.register(
    'src/config/className',
    'cls.js',
    (key, value) => {
      return `  ${key}: '${value}'`;
    },
  );
  next();
  const data = `export default {\n${_ctx.getClassName().join(',\n')}\n};`;
  _ctx.writeFile(data);
}
```
如果需要异步处理，可使用：
```jsx
async (ctx, next) => {
  const _ctx = ctx.register(
    'src/config/className',
    'cls.js',
    (key, value) => {
      return `  ${key}: '${value}'`;
    },
  );
  await next();
  const data = `export default {\n${_ctx.getClassName().join(',\n')}\n};`;
  _ctx.writeFile(data);
}
```

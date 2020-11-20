 <h1 align="center">ClassName Register</h1>
 
 <div align="center">
 
 通过配置来生成符合“姓氏命名法”的className对象。


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
私有属性 | 类型 | 描述 |
--- | --- | --- | 
register | Function | 接受三个值（path:string,filename:sting,handler:function） | 
getClassNames | Function | 接受一个值（filename:string）,返回构建完成的classNames | 
writeFile | Function | 接受两个值（filename:string,data:string）,会执行写入操作，将文件名写入之前定义的目录中。 | 

##### 基础定义
```jsx
(ctx, next) => {
      ctx.register(
        'src/config/className',
        'cls.js',
        (key, value) => {
          return `  ${key}: '${value}'`;
        },
      );
      next();
      const data = `export default {\n${ctx.getClassNames('cls.js').join(',\n')}\n};`;
      ctx.writeFile('cls.js', data);
}
```
> 此时layout字段会被注册，并生成带有命名空间前缀的className
> 最终生成
```js
{
  layout:'craig-layout'
};
```

# vue2-uploader
一个简单的,基于axios和FormData的Vue上传组件.  
* 由于项目依赖于FormData,因此不支持IE9及以下的IE浏览器(可以尝试其它的shim方案,但不保存能正常使用),其它浏览器的兼容性可以参考相关的浏览器说明
* 需要手动引入[axios](https://github.com/axios/axios)库
* 由于axios依赖于Promise,因此如果要在IE10/IE11+上使用时,需要导入相应的polyfill  

项目中包含一个可运行的示例.
下载项目,通过下列方式运行示例项目
```
npm install && npm run dev
```
访问[http://locahost](http://locahost)即可看到上传页面.

示例代码中提供了一个Spring版本的简单服务端代码.代码基于Spring-boot,需要maven环境.可通过下下列方式启动测试服务器
```bash
cd java-server
mvn spring-boot:run
```

## More Info
[使用方法](https://github.com/ldwqh0/vue2-uploader/wiki/%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95)  
[分块上传](https://github.com/ldwqh0/vue2-uploader/wiki/Component-API)  
[Component API](https://github.com/ldwqh0/vue2-uploader/wiki/Component-API)  
## 更新历史
* 0.1.7
  增加一个配置对象，可以配置uploader的上传实例
* 0.1.6
  
* 0.1.5  
  去掉事件的on-前缀
* 0.1.4  
  优化代码,提升运行效率,简化事件模型,实现了批量上传,实现了整体进度计算
* 0.1.3  
  修改发布脚本
* 0.1.2  
  修改发布脚本
* 0.1.1  
  修正说明文档中的java代码的错误
* 0.1.0  
  新增分块上传功能
* 0.0.9  
  重新设计的任务模型
  增加docs文档目录
  移除onItemBeforeUpload事件,
  移除fileItem.$$index属性,增加fileItem.id属性,标识文件的唯一性
  移除fileItem的state属性  
* 0.0.8  
  增accept属性,可以设置文件类型筛选.  
  修正了一个非自动上传模式下取消文件上传无效的bug.
  更新一个单项上传成功事件不能正确获取响应的问题.
  示例代码中增加一个简单的服务器,可以返回简单响应,去掉原来的测试Proxy.
* 0.0.7  
  修正filter中的默认值错误
* 0.0.1-0.0.6  
  初始版本,持续跟进中
## 计划中的功能
* 断点续传


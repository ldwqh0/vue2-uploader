# vue2-uploader
一个简单的，基于axios和FormData的Vue上传组件
项目中包含一个可运行的示例。
下载项目，通过下列方式运行示例项目
```
npm install && npm run dev
```
## 基本用法
### 导入组件
```
npm install -S vue2-uploader
```
### 示例代码
```html
<template>
  <vue-uploader :multiple="true"
                url="/w/file"
                @change="change"
                :auto-upload="false">
    <span>可自定义的上传按钮</span>
  </vue-uploader>
  <table>
    <tr v-for="fileItem in files" :key="file.$$index">
      <td>{{ fileItem.file.name }}</td>
      <td>{{ fileItem.state }}</td>
      <td>{{ fileItem.progress }}%</td>
      <td><a href="javascript:void(0);" @click="file.cancel()">删除</a></td>
      <td><a href="javascript:void(0);" @click="file.uploadItem()">上传</a></td>
    </tr>
  </table>
</template>
<script>
  import VueUploader from 'vue2-uploader'
  export default {
    components:{
      VueUploader
    },
    data () {
      return {
        files: []
      }
    },
    methods: {
      change (files) {
        this.files = files
      }
    }
  }
</script>
```
组件提供一个default slot,可以自定义按钮的内容，但组件不提供样式，如果你需要自定义的样式，可以参考demo里面的代码

## 组件属性
|属性名称|说名|类型|默认值|
| :- | :- | :- | :- |
|autoUpload|是否自动上传|Boolean|false|
|multiple|是否可以选择多个文件|Boolean|false|
|url|上传地址|String|无(必传项)|
|maxThreads|最大同时上传进程数|Number|3|
|name|上传到服务器的参数名称|String|"file"|
|filter|文件过滤器，可以时一个正则表达式或者一个函数，当函数返回值为true时，表示通过过滤，函数可以参数为file: File|RegExp, Function|()=>true|

## 组件事件说明
|事件名称|说明|回调参数|参数说明|
| :- | :- | :- | :- |
|on-add|添加文件事件|(fileItem: FileItem)|被添加的文件|
|change|文件改变事件|(files[]: Files[])|所有的文件项|
|on-complete|所有文件上传完成|无|无|
|on-item-before-upload|单项文件在上传之前发生|(fileItem: FileItem)|待上传的文件项|
|on-item-progress|单项进度改变事件|(fileItem: FileItem,p)|fileItem: 产生进度改变的文件，p: 进度信息|
|on-item-success|单项上传成功事件|(fileItem: FileItem,response: Response)|上传成功的文件项，服务器响应|
|on-item-cancel|单项文件取消事件|(fileItem: FileItem)|取消的文件项|
|on-item-error|单项文件上传错误事件|(fileItem: FileItem,error:Error)|错误的文件项，错误信息|
|on-item-complete|文件上传完成（无论成功还是失败事件，文件上传完成（无论成功还是失败）|(fileItem: FileItem)|完成的文件项|

## FileItem属性
|属性名称|类型|属性说明|
| :- | :- | :-|
|state|String|文件上传状态，有add(新增) ,ready(就绪), processing(上传中), completed(上传完成)/failed(上传失败)。FileItem会进行以上状态次序转换，不会发生逆转换|
|progress|Number|文件上传进度,0-100之间的数值|
|file|File|文件信息|
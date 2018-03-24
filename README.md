# vue-uploader
A Vue Uploader Component
用法
```html
<vue-uploader :multiple="true"
              url="/w/file"
              @on-add="onAdd"
              @on-item-progress-changed="itemProgressChanged"
              :auto-upload="false">上传good
</vue-uploader>
```
属性说明
```javascript
 props: {
    autoUpload: {// 是否自动上传
      type: Boolean,
      default: false
    },
    multiple: { // 是否可以选择多个文件
      type: Boolean,
      default: false
    },
    url: { // 上传地址
      type: String,
      required: true
    }
  }
```
事件说明
```javascript
methods: {
  on-add (item) {// 添加文件事件，在添加一个文件后触发。item是添加的文件项
    console.log(item)
  },
  on-item-progress-changed (item,progressChangeEvent) {
    
  },
  on-item-success (item) {
    //单项上传完成
  }
}
```

<template>
  <span class="vue-uploader">
    <slot>
      <span class="vue-uploader-icon">上传文件</span>
    </slot>
    <input :multiple="multiple"
           type="file"
           ref="fileInput"
           @change="change"
           :name="name">
  </span>
</template>
<script>
  import FileItem from '../lib/FileItem'
  import Uploader from '../lib/Uploader'

  export default {
    name: 'VueUploader',
    props: {
      autoUpload: { // 是否自动上传
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
      },
      maxThreads: { // 最大同时上传进程数，默认最多可以三个文件一起上传
        type: Number,
        default: 3
      },
      name: { // 上传到服务器的属性名称,默认是file
        type: String,
        default: 'file'
      },
      filter: { // 文件过滤器，一个正则表达式或者一个函数，当选择添加文件时，会对每个文件进行校验。返回true表示校验通过。
        type: [RegExp, Function],
        default: () => () => true
      }
    },
    data () {
      return {
        files: [],
        uploader: new Uploader({
          url: this.url,
          maxThreads: this.maxThreads,
          events: {
            onItemProgress: (fileItem, p) => {
              this.$emit('on-item-progress', fileItem, p)
            },
            onItemSuccess: fileItem => {
              this.$emit('on-item-success', fileItem)
            },
            onItemError: (fileItem, e) => {
              this.$emit('on-item-error', fileItem, e)
            },
            onItemComplete: fileItem => {
              this.$emit('on-item-complete', fileItem)
            },
            onItemBeforeUpload: fileItem => {
              this.$emit('on-item-before-upload', fileItem)
            },
            onComplete: () => {
              this.$emit('on-complete')
            },
            onItemCancel: fileItem => {
              for (let i in this.files) {
                if (this.files[i] === fileItem) {
                  this.files.splice(i, 1)
                  this.$emit('on-item-cancel', fileItem)
                  this.$emit('change', this.files)
                  break
                }
              }
            }
          }
        })
      }
    },
    created () {},
    methods: {
      change (e) {
        console.log('change', e)
        for (let file of e.target.files) {
          if (this.doFilter(file)) { // 校验文件是否符合规则，如果符合规则，添加到文件列表，如果不符合，不添加
            let fileItem = new FileItem({
              file,
              uploader: this.uploader
            })
            this.files.push(fileItem)
            this.$emit('on-add', fileItem)
            if (this.autoUpload) {
              this.uploader.uploadItem(fileItem)
            }
          }
        }
        this.$refs.fileInput.value = ''
        this.$emit('change', this.files)
      },
      doFilter (file) {
        if (this.filter instanceof RegExp) {
          return this.filter.test(file.name)
        } else if (this.filter instanceof Function) {
          return this.filter(file)
        } else {
          return false
        }
      }
    }
  }
</script>

<template>
  <span class="vue-uploader">
    <slot>上传文件</slot>
    <input :multiple="multiple"
           type="file"
           ref="fileInput"
           @change="change"
           name="file">
    <table>
      <tr v-for="file in files" :key="file.$$index">
        <td>{{ file.$$id }}</td>
        <td>{{ file.file.name }}</td>
        <td>{{ file.state }}</td>
        <td>{{ file.progress }}</td>
        <td><a href="javascript:void(0);" @click="file.cancel()">删除</a></td>
        <td><a href="javascript:void(0);" @click="file.uploadItem()">上传</a></td>
      </tr>
    </table>
  </span>
</template>
<script>
  import FileItem from '../lib/FileItem'
  import Uploader from '../lib/Uploader'
  export default {
    name: 'VueUploader',
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
      },
      maxThreads: { // 最大同时上传进程数
        type: Number,
        default: 3
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
            onItemComplete: (fileItem) => {
              this.$emit('on-item-complete', fileItem)
            },
            onItemBeforeUpload: (fileItem) => {
              this.$emit('on-item-before-upload', fileItem)
            },
            onComplete: () => {
              this.$emit('on-complete')
            },
            onItemCancel: (fileItem) => {
              for (let i in this.files) {
                if (this.files[i] === fileItem) {
                  this.files.splice(i, 1)
                  break
                }
              }
              this.$emit('on-item-cancel', fileItem)
            }
          }
        })
      }
    },
    created () {
    },
    methods: {
      change (e) {
        for (let file of e.target.files) {
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
        this.$refs.fileInput.value = ''
      }
    }
  }
</script>

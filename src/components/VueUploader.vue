<template>
  <span class="vue-uploader">
    <slot>
      <span class="vue-uploader-icon">上传文件</span>
    </slot>
    <input :multiple="multiple"
           :accept="accept"
           type="file"
           ref="fileInput"
           @change="_$$change"
           :name="name">
  </span>
</template>
<script>
  import FileItem from '../lib/FileItem'
  import Uploader from '../lib/Uploader'

  export default {
    name: 'VueUploader',
    props: {
      accept: {
        type: String,
        default: '*'
      },
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
      },
      chunkSize: { // 文件分块大小,为0代表不分块
        type: Number,
        default: () => 0
      }
    },
    data () {
      return {
        files: [],
        uploader: new Uploader({
          url: this.url,
          maxThreads: this.maxThreads,
          chunkSize: this.chunkSize
        })
      }
    },
    created () {
      this.uploader.onComplete = () => {
        this._$$onComplete()
      }
    },
    computed: {
      progress () {
        return Number.parseInt(this.loaded / this.total * 100)
      },
      loaded () {
        let loaded = 0
        for (let fileItem of this.files) {
          loaded += fileItem.loaded
        }
        return loaded
      },
      total () {
        let count = 0
        for (let fileItem of this.files) {
          count += fileItem.file.size
        }
        return count
      }
    },
    watch: {
      progress (val) {
        this.$emit('progress', val)
      }
    },
    methods: {
      uploadAll () {
        for (let fileItem of this.files) {
          if (fileItem.state === 'new') {
            this.uploader.uploadItem(fileItem)
          }
        }
      },
      cancelAll () {
        for (let fileItem of this.files) {
          fileItem.cancel()
        }
      },
      _$$change (e) {
        for (let file of e.target.files) {
          if (this._$$doFilter(file)) { // 校验文件是否符合规则，如果符合规则，添加到文件列表，如果不符合，不添加
            let fileItem = new FileItem({file, url: this.url, chunkSize: this.chunkSize})
            fileItem.onProgress = (progress) => this._$$onItemProgress(fileItem, progress)
            fileItem.onComplete = () => this._$$onItemComplete(fileItem)
            fileItem.onSuccess = (response) => this._$$onItemSuccess(fileItem, response)
            fileItem.onError = (e) => this._$$onItemError(fileItem, e)
            fileItem.onCancel = () => this._$$onItemCancel(fileItem)
            fileItem.uploadItem = () => {
              this.uploader.uploadItem(fileItem)
            }
            this.files.push(fileItem)
            this.$emit('add', fileItem)
            if (this.autoUpload) {
              this.uploader.uploadItem(fileItem)
            }
          }
        }
        this.$refs.fileInput.value = ''
        this.$emit('change', this.files)
      },
      _$$doFilter (file) {
        if (this.filter instanceof RegExp) {
          return this.filter.test(file.name)
        } else if (this.filter instanceof Function) {
          return this.filter(file)
        } else {
          return false
        }
      },
      _$$onItemProgress  (fileItem, p) {
        this.$emit('item-progress', fileItem, p)
      },
      _$$onItemSuccess  (fileItem, response) {
        this.$emit('item-success', fileItem, response)
      },
      _$$onItemError  (fileItem, error) {
        this.$emit('item-error', fileItem, error)
      },
      _$$onItemComplete  (fileItem) {
        this.$emit('item-complete', fileItem)
      },
      _$$onComplete  () {
        this.$emit('complete')
      },
      _$$onItemCancel (fileItem) {
        for (let i in this.files) {
          if (this.files[i] === fileItem) {
            this.files.splice(i, 1)
            this.$emit('item-cancel', fileItem)
            this.$emit('change', this.files)
            return
          }
        }
      }
    }
  }
</script>

<template>
  <div class="vue-uploader">
    <span class="vue-uploader-btn" @click="openchoose">
      <slot name="button">
        <span class="vue-uploader-icon">上传文件</span>
      </slot>
    </span>
    <input ref="fileInput"
           style="display: none;"
           :multiple="multiple"
           :accept="accept"
           type="file"
           :name="name"
           @change="_$$change">
    <slot v-if="showProgress" name="file-list" :files="files">
      <div class="file-list">
        <table>
          <template v-for="(item,index) in files">
            <tr :key="index">
              <td>{{ item.file.name }}</td>
              <td v-if="!item.hasError">{{ item.progress }}%</td>
              <td v-if="item.hasError" style="color: red">{{ item.error }}</td>
              <td>
                <a href="javascript:void(0)" @click="item.cancel()">取消</a>
              </td>
            </tr>
          </template>
        </table>
      </div>
    </slot>
  </div>
</template>
<script>
  import axios from 'axios'
  import uuid from 'uuid/v1'

  const CancelToken = axios.CancelToken

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
      },
      showProgress: {
        type: [Boolean],
        default: () => true
      },
      http: {
        type: [Object, Function],
        default: () => axios.create()
      }
    },
    data () {
      return {
        files: []
      }
    },
    computed: {
      // 进度百分比
      progress () {
        if (this.total === 0) {
          return 0
        } else {
          return Number.parseInt(this.loaded / this.total * 100)
        }
      },
      // 已上传的部分
      loaded () {
        return this.files.reduce((count, file) => file.loaded + count, 0)
      },
      //  文件总大小
      total () {
        return this.files.reduce((count, file) => file.file.size + count, 0)
      }
    },
    watch: {
      progress (val) {
        this.$emit('progress', val)
      }
    },
    created () {
      this.taskExecutor = new TaskExecutor({
        maxThreads: this.maxThreads
      })
      this.taskExecutor.onComplete = () => this.$emit('complete', this.files.filter(item => !item.hasError))
    },
    methods: {
      uploadAll () {
        // 提交所有任务
        this.files.forEach(file => this.taskExecutor.post(file))
      },
      cancelAll () {
        // 取消所有任务
        [...this.files].forEach(item => item.cancel())
      },
      removeItem (fileItem) {
        for (const i in this.files) {
          if (this.files[i] === fileItem) {
            this.files.splice(i, 1)
            this.$emit('change', this.files)
            return
          }
        }
      },
      _$$change (e) {
        for (const file of e.target.files) {
          if (this._$$doFilter(file)) { // 校验文件是否符合规则，如果符合规则，添加到文件列表，如果不符合，不添加
            const fileItem = new Task({
              file,
              url: this.url,
              chunkSize: this.chunkSize,
              http: this.http,
              name: this.name
            })
            fileItem.onProgress = (progress) => this.$emit('item-progress', fileItem, progress)
            fileItem.onComplete = () => {
              this.$emit('item-complete', fileItem)
            }
            fileItem.onSuccess = (response) => this.$emit('item-success', fileItem, response)
            fileItem.onError = (e) => this.$emit('item-error', fileItem, e)
            fileItem.onCancel = () => {
              this.removeItem(fileItem)
              this.$emit('item-cancel', fileItem)
            }
            this.files.push(fileItem)
            this.$emit('add', fileItem)
            if (this.autoUpload) {
              this.taskExecutor.post(fileItem)
            } else {
              fileItem.uploadItem = () => this.taskExecutor.post(fileItem)
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
      openchoose () {
        this.$refs.fileInput.click()
      }
    }
  }

  class Task {
    $$id
    /**
     * 当前状态,模拟线程的5态 new ,runnable,running,blocked,dead
     * new 代表一个新任务
     * runnable 表示将任务推送到任务队列中
     * running 表示任务正在上传中
     * blocked 表示任务被取消
     * dead 表示任务终止
     */
    $$state = 'new'
    $$chunkIndex = 0
    $$cancelTokenSource // 取消标记
    $$loaded = 0 // 已经上传的大小
    // 请求的响应
    response = {}
    // 错误信息
    error = null

    onProgress () {
      // do nothing
    }

    onSuccess () {
      // do nothing
    }

    onError () {
      // do nothing
    }

    onComplete () {
      // do nothing
    }

    onCancel () {
      // do nothing
    }

    get id () {
      return this.$$id
    }

    set state (state) {
      this.$$state = state
      if (state === 'dead') {
        this.onComplete()
      }
    }

    get state () {
      return this.$$state
    }

    get loaded () {
      return this.$$loaded
    }

    get progress () {
      const p = this.$$loaded / this.file.size * 100
      if (p >= 100 && this.$$state === 'dead') {
        return 100
      } else if (p > 1) {
        return p - 1
      }
    }

    get hasError () {
      return this.error !== undefined && this.error !== null
    }

    constructor ({ file, url, chunkSize, http, name }) {
      this.$$id = uuid()
      this.file = file
      this.url = url
      this.chunkSize = chunkSize
      this.name = name
      this.http = http
    }

    run () {
      return new Promise((resolve, reject) => {
        if (this.chunkSize > 0) {
          let response
          let error = 0
          let position = 0
          const chunkCount = Math.ceil(this.file.size / this.chunkSize)
          let chunkIndex = 0
          let err
          const r = () => {
            if (this.state !== 'running') {
              resolve()
            } else {
              if (position < this.file.size) {
                if (error < 10) {
                  this.$$uploadChunk({ position, chunkCount, chunkIndex }).then((r) => {
                    response = r
                    position += this.chunkSize
                    error = 0
                    chunkIndex++
                  }).catch(e => {
                    error++
                    err = e
                  }).finally(r)
                } else {
                  this.state = 'dead'
                  this.error = err
                  reject(err)
                }
              } else {
                if (error <= 0) {
                  // 完成之后设置进度
                  this.state = 'dead'
                  this.response = response
                  this.onSuccess(response)
                  resolve()
                }
              }
            }
          }
          r()
        } else {
          this.$$uploadFile().then(response => {
            this.onSuccess(response)
            this.response = response
            resolve()
          }).catch(e => {
            this.error = e
            this.onError(e)
            reject(e)
          }).finally(() => {
            this.state = 'dead'
          })
        }
      })
    }

    /**
     * 上传一块
     */
    $$uploadChunk ({ position, chunkIndex, chunkCount }) {
      this.$$cancelTokenSource = CancelToken.source()
      const cancelToken = this.$$cancelTokenSource.token
      const blob = this.file.slice(position, position + this.chunkSize)
      const data = new FormData()
      data.append(this.name, blob)
      data.append('filename', this.file.name)
      return this.http.post(this.url, data, {
        headers: {
          'Chunk-Index': chunkIndex,
          'File-Id': this.id,
          'Chunk-Count': chunkCount
        },
        cancelToken,
        onUploadProgress: p => {
          // 进度改变时，刷新块进度
          this.$$loaded = position + p.loaded
          this.onProgress(this.progress)
        }
      })
    }

    $$uploadFile () {
      this.$$cancelTokenSource = CancelToken.source()
      const cancelToken = this.$$cancelTokenSource.token
      const data = new FormData()
      data.append(this.name, this.file)
      return this.http.post(this.url, data, {
        cancelToken,
        onUploadProgress: ({ loaded }) => {
          // 进度改变时，刷新块进度
          this.$$loaded = loaded
          this.onProgress(this.progress)
        }
      })
    }

    /**
     * 取消这个上传任务
     */
    cancel () {
      if (this.$$cancelTokenSource) {
        this.$$cancelTokenSource.cancel('用户取消了上传')// 取消上传
      }
      this.state = 'blocked'
      this.onCancel()
    }
  }

  // 一个任务调度器，用于任务处理
  class TaskExecutor {
    // 任务队列
    queue = []
    $$threads = 0
    onComplete = () => {
      // do nothing
    }

    // 任务调度的最大线程数默认为3
    constructor ({ maxThread = 3 } = { maxThread: 3 }) {
      this.maxThread = maxThread
    }

    // 提交一个任务
    post (task) {
      if (task.state === 'new') {
        this.queue.push(task)
        task.state = 'runnable'
        setTimeout(() => this.execute())
      }
    }

    // 执行任务
    execute () {
      if (this.queue.length > 0) {
        while (this.$$threads < this.maxThread && this.queue.length > 0) {
          const task = this.queue.shift()
          if (task.state === 'runnable') {
            task.state = 'running'
            // 任务完成之后,启动一个新的任务
            this.$$threads++
            const fn = task.onComplete
            task.onComplete = () => {
              this.$$threads--
              if (fn instanceof Function) {
                fn.call(task)
              }
              if (this.$$threads <= 0) {
                this.onComplete()
              } else {
                this.execute()
              }
            }
            task.run()
          }
        }
      }
    }
  }
</script>

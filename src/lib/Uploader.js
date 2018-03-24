import axios from 'axios'

const cancelToken = axios.CancelToken
export default class Uploader {
  processor = 0 // 上传数量计算器
  events = {
    onItemBeforeUpload (item) {}, // 单项准备上传事件
    onItemProgress (item, p) {}, // 单项进度改变事件
    onItemSuccess (item) {}, // 单项成功事件
    onItemError (item, e) {}, // 单项错误事件
    onItemComplete (item) {}, // 单项上传完成事件
    onItemCancel (item) {}, // 取消事件
    onComplete () {}// 所有文件上传事件上传
  }
  _$http = axios.create()

  constructor ({url, maxProcessor = 3, events}) {
    this.url = url // 上传的地址
    this.maxProcessor = maxProcessor// 最大同时上传数
    console.debug(this.maxProcessor)
    this.queue = [] // 整个上传队列
    this.events = Object.assign({}, this.events, events) // 进度回掉事件
  }

  /**
   * 取消上传某个文件
   * @param fileItem
   */
  cancelItem (fileItem) {
    if (fileItem.state === 'completed') {
    } else {
      fileItem._cancelTokenSource.cancel('用户取消了上传')
      this.events.onItemCancel(fileItem)
    }
  }

  uploadItem (fileItem) {
    this.addItem(fileItem)
    this.upload()
  }

  addItem (fileItem) {
    fileItem.state = 'ready'
    this.queue.push(fileItem)
  }

// 上传文件
  upload () {
    if (this.queue.length <= 0) return
    // 获取队列的头，并上传
    while (this.processor < this.maxProcessor && this.queue.length > 0) {
      let item = this.queue.shift()
      if (item === undefined) {
      } else {
        this.events.onItemBeforeUpload(item)
        item.state = 'processing'
        this.processor++
        let data = new FormData()
        data.append('file', item.file)
        // 上传文件的实际操作
        item._cancelTokenSource = cancelToken.source()
        this._$http.post(this.url, data, {
          cancelToken: item._cancelTokenSource.token,
          onUploadProgress: p => {
            this.events.onItemProgress(item, p)
            item.progress = p.loaded / p.total * 100
            if (item.progress > 2) {
              item.progress -= 1
            }
          }
        }).then(response => {
          this.events.onItemSuccess(item)
          item.state = 'completed'
          item.progress = 100
        }).catch(e => {
          item.state = 'failed'
          this.events.onItemError(item, e)
        }).finally(() => {
          this.events.onItemComplete(item)
          this.processor--
          this.upload() // 递归调有，继续上传
          setTimeout(() => {
            if (this.processor <= 0) {
              this.events.onComplete()
            }
          })
        })
      }
    }
  }
}

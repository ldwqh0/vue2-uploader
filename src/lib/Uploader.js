import axios from 'axios'

const cancelToken = axios.CancelToken
export default class Uploader {
  _$$threads = 0 // 上传线程计数器
  _$$events = {
    onItemBeforeUpload (item) {}, // 单项准备上传事件
    onItemProgress (item, p) {}, // 单项进度改变事件
    onItemSuccess (item) {}, // 单项成功事件
    onItemError (item, e) {}, // 单项错误事件
    onItemComplete (item) {}, // 单项上传完成事件
    onItemCancel (item) {}, // 取消事件
    onComplete () {}// 所有文件上传事件上传
  }
  _$$http = axios.create()

  constructor ({url, maxThreads = 3, events}) {
    this.url = url // 上传的地址
    this._$$maxThreads = maxThreads// 最大同时上传数
    this._$$queue = [] // 整个上传队列
    this._$$events = Object.assign({}, this._$$events, events) // 进度回掉事件
  }

  /**
   * 取消上传某个文件
   * @param fileItem
   */
  cancelItem (fileItem) {
    if (fileItem.state === 'completed') {
      // 如果文件已经上传完成了，什么都不做
    } else if (fileItem.state === 'add' || fileItem.state === 'failed') {
      // 如果文件还没有进入事件上传流程，或者文件已经上传失败，通知组件，让组件处理
      this._$$events.onItemCancel(fileItem)
    } else if (fileItem.state === 'ready') {
      // 如果文件已经进入上传队列，但还没有开始上传,将文件从上传队列中删除
      for (let i in this._$$queue) {
        let _fileItem = this._$$queue[i]
        if (_fileItem === fileItem) {
          this._$$queue.splice(i, 1)
          this._$$events.onItemCancel(fileItem)
          return
        }
      }
    } else if (fileItem.state === 'processing') {
      fileItem._cancelTokenSource.cancel('用户取消了上传')
      this._$$events.onItemCancel(fileItem)
    }
  }

  /**
   * 上传单个文件。同时启动上传队列
   * @param fileItem
   */
  uploadItem (fileItem) {
    fileItem.state = 'ready'
    this._$$queue.push(fileItem)
    setTimeout(() => {
      this.upload()
    })
  }

  /**
   * 上传文件
   */
  upload () {
    if (this._$$queue.length <= 0) return
    // 获取队列的头，并上传
    while (this._$$threads < this._$$maxThreads && this._$$queue.length > 0) {
      let item = this._$$queue.shift()
      if (item === undefined) {
      } else {
        this._$$events.onItemBeforeUpload(item)
        item.state = 'processing'
        this._$$threads++
        let data = new FormData()
        data.append('file', item.file)
        // 上传文件的实际操作
        item._cancelTokenSource = cancelToken.source()
        this._$$http.post(this.url, data, {
          cancelToken: item._cancelTokenSource.token,
          onUploadProgress: p => {
            this._$$events.onItemProgress(item, p)
            item.progress = p.loaded / p.total * 100
            if (item.progress > 2) {
              item.progress -= 1
            }
          }
        }).then(response => {
          this._$$events.onItemSuccess(item, response)
          item.state = 'completed'
          item.progress = 100
        }).catch(e => {
          item.state = 'failed'
          this._$$events.onItemError(item, e)
        }).finally(() => {
          this._$$events.onItemComplete(item)
          this._$$threads--
          this.upload() // 递归调有，继续上传
          setTimeout(() => { // 在每次完成之后，判断一下是否已经上传完成了。
            if (this._$$threads <= 0) {
              this._$$events.onComplete()
            }
          })
        })
      }
    }
  }
}

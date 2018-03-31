/**
 * 一个任务调度器,用于任务队列的维护
 */
export default class Uploader {
  _$$threads = 0 // 上传线程计数器
  _$$chunkSize // 文件分块的大小
  _$$events = {
    // onItemBeforeUpload (item) {}, // 单项准备上传事件
    onItemProgress (item, p) {}, // 单项进度改变事件
    onItemSuccess (item) {}, // 单项成功事件
    onItemError (item, e) {}, // 单项错误事件
    onItemComplete (item) {}, // 单项上传完成事件
    onItemCancel (item) {}, // 取消事件
    onComplete () {} // 所有文件上传事件上传
  }
  constructor ({url, maxThreads = 3, events, chunkSize = 0}) {
    // this.url = url // 上传的地址
    this._$$maxThreads = maxThreads// 最大同时上传数
    this._$$queue = [] // 整个上传队列
    this._$$events = Object.assign({}, this._$$events, events) // 进度回掉事件
    this._$$chunkSize = chunkSize
  }

  /**
   * 向上传队列中增加一个任务。同时启动上传队列
   * @param fileItem
   */
  uploadItem (fileItem) {
    fileItem._$$state = 'runnable'// 任务进入队列之前，转入runable态
    this._$$queue.push(fileItem)
    setTimeout(() => {
      this._$$upload()
    })
  }

  /**
   * 上传文件
   */
  _$$upload () {
    if (this._$$queue.length <= 0) return
    // 获取队列的头，并上传
    while (this._$$threads < this._$$maxThreads && this._$$queue.length > 0) {
      let fileItem = this._$$queue.shift()
      if (fileItem === undefined) {
      } else {
        if (fileItem.state === 'runnable') {
          fileItem.onComplete = () => this._$onComplete(fileItem)
          fileItem.onSuccess = response => this._$$events.onItemSuccess(fileItem, response)
          fileItem.onProgress = p => this._$$events.onItemProgress(fileItem, p)
          fileItem.onError = e => this._$$events.onItemError(fileItem, e)
          fileItem._$$state = 'running'
          this._$$threads++
          fileItem.run()// 启动任务
        }
      }
    }
  }

  /**
   * 当某个任务完成之后，重新启动上传进程
   */
  _$onComplete (item) {
    this._$$threads--
    this._$$events.onItemComplete(item)
    this._$$upload()
    setTimeout(() => {
      if (this._$$threads <= 0) {
        this._$$events.onComplete()
      }
    })
  }
}

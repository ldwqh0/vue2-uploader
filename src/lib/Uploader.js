import Task from './Task'
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
    this.url = url // 上传的地址
    this._$$maxThreads = maxThreads// 最大同时上传数
    this._$$queue = [] // 整个上传队列
    this._$$events = Object.assign({}, this._$$events, events) // 进度回掉事件
    this._$$chunkSize = chunkSize
  }

  /**
   * 取消上传某个文件
   * @param fileItem
   */
  cancelItem (fileItem) {
    let task = fileItem.task
    if (task) { // 如果任务已经进入了运行队列，取消执行，否则直接从队列中移除
      if (task.state === 'running' || task.state === 'blocked') {
        task.cancel()
        this._$$events.onItemCancel(fileItem)
      } else {
        for (let i in this._$$queue) {
          let _fileItem = this._$$queue[i]._$$fileItem
          if (_fileItem === fileItem) {
            this._$$queue.splice(i, 1)
            this._$$events.onItemCancel(fileItem)
            return
          }
        }
      }
    }
  }

  /**
   * 向上传队列中增加一个任务。同时启动上传队列
   * @param fileItem
   */
  uploadItem (fileItem) {
    let task = new Task({fileItem, url: this.url, chunkSize: this._$$chunkSize})
    fileItem.task = task
    task._$$state = 'runnable'// 任务进入队列之前，转入runable态
    this._$$queue.push(task)
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
      let task = this._$$queue.shift()
      if (task === undefined) {
      } else {
        if (task.state === 'runnable') {
          task.onComplete = item => this._$onComplete(item)
          task.onSuccess = (item, response) => this._$$events.onItemSuccess(item, response)
          task.onProgress = (item, p) => this._$$events.onItemProgress(item, p)
          task.onError = (item, error) => this._$$events.onItemError(item, error)
          task._$$state = 'running'
          this._$$threads++
          task.run()// 启动任务
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

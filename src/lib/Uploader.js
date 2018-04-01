/**
 * 一个任务调度器,用于任务队列的维护
 */
export default class Uploader {
  _$$threads = 0 // 上传线程计数器
  _$$chunkSize // 文件分块的大小
  onComplete () {} // 所有队列中的任务上传完成后引发的事件
  constructor ({url, maxThreads = 3, chunkSize = 0}) {
    // this.url = url // 上传的地址
    this._$$maxThreads = maxThreads// 最大同时上传数
    this._$$queue = [] // 整个上传队列
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
        let fn = fileItem.onComplete
        fileItem.onComplete = () => { // 在文件上传完成之后，
          this._$onComplete(fileItem, fn)
        }
        fileItem._$$state = 'running'
        this._$$threads++
        fileItem.run()// 启动任务
      }
    }
  }

  /**
   * 当某个任务完成之后，重新启动上传进程
   */
  _$onComplete (item, fn) {
    this._$$threads--
    this._$$upload()
    if (fn instanceof Function) {
      fn.call(item)
    }
    setTimeout(() => {
      if (this._$$threads <= 0) {
        this.onComplete()
      }
    })
  }
}

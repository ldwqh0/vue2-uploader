import axios from 'axios'

const $http = axios.create() // 定义一个上传的axios对象
const CancelToken = axios.CancelToken
/**
 * 代表一个上传任务
 */
export default class Task {
  _$$fileItem // 任务的文件
  _$$thunkSize // 任务的分片大小
  _$$state //当前状态,模拟线程的5态 new,runnable,running,blocked,dead
  _$$position = 0 // 当前的位置
  _$$error = 0
  _$$thunkProgress = 0
  _$$cancelTokenSource //取消标记

  constructor ({fileItem, thunkSize}) {
    this._$$fileItem = fileItem
    this._$$thunkSize = thunkSize
    this._$$state = 'new'
  }

  /**
   * 获取上传进度
   */
  get progress () {
    return this._$$position + this._$$thunkProgress
  }

  /**
   * 获取状态
   */
  get state () {
    return this._$$state
  }

  /**
   * 启动这个上传任务
   */
  start () {
    this.run()
  }

  /**
   * 取消这个上传任务
   */
  cancel () {
    this._$$cancelTokenSource.cancel()//取消上传
  }

  // 事件的操作
  async run () {
    while (this._$$position < this._$$fileItem.size) {//依次循环上传
      try {
        await this.uploadThunk()
        this._$$position += this._$$thunkSize
        this._$$error = 0
      } catch (e) {
        if (this._$$error++ >= 10) {
          // 上传失败
        }
      }
    }
    // 上传完成
  }

  uploadThunk () {
    this._$$cancelTokenSource = CancelToken.source()
    cancelToken = this._$$cancelTokenSource.token

    return $http.post('url', data, {
      cancelToken,
      onUploadProgress: p => {
        // 进度改变时，刷新进度
        this._$$thunkProgress = p.loaded
      }
    })
  }
}

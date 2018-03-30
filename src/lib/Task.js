import axios from 'axios'

const $http = axios.create() // 定义一个上传的axios对象
const CancelToken = axios.CancelToken
/**
 * 代表一个上传任务
 */
export default class Task {
  _$$fileItem // 任务的文件
  _$$thunkSize // 任务的分片大小
  _$$state // 当前状态,模拟线程的5态 new,runnable,running,blocked,dead
  _$$position = 0 // 当前的位置
  _$$error = 0
  _$$thunkProgress = 0
  _$$cancelTokenSource // 取消标记
  _$$progress=0
  onProgress (filItem, progress) { }
  onComplete (item) {}
  onSuccess (item, response) {}
  onError (item) {}
  constructor ({fileItem, thunkSize = 0, url}) {
    this._$$url = url
    this._$$fileItem = fileItem
    this._$$thunkSize = thunkSize
    this._$$state = 'new'
  }

  /**
   * 获取上传进度
   */
  get progress () {
    return this._$$progress
  }

  /**
   * 获取状态
   */
  get state () {
    return this._$$state
  }

  /**
   * 取消这个上传任务
   */
  cancel () {
    if (this._$$cancelTokenSource) {
      this._$$cancelTokenSource.cancel('用户取消了上传')// 取消上传
    }
    this._$$state = 'dead' // 将任务标记为结束
  }

  // 执行任务
  async run () {
    if (this._$$thunkSize > 0) {
      while (this._$$position < this._$$fileItem.file.size) { // 依次循环上传
        try {
          await this._$$uploadThunk()
          this._$$position += this._$$thunkSize
          this._$$error = 0
        } catch (e) {
          console.log(e)
          if (this._$$error++ >= 10) {
            // 上传失败,引发事件
            this.onError(this._$$fileItem)
            break
          }
        }
      }
    } else {
      try {
        let response = await this._$$uploadFile()
        this._$$setProgerss(100)
        this.onSuccess(this._$$fileItem, response)
      } catch (e) {
        this.onError(this._$$fileItem)
      }
    }
    this.onComplete(this._$$fileItem)
    this._$$state = 'dead' // 标记任务完成
  }

  /**
   * 上传完整的文件，而不是分块上传
   */
  _$$uploadFile () {
    if (this.state === 'dead') return
    this._$$cancelTokenSource = CancelToken.source()
    let cancelToken = this._$$cancelTokenSource.token
    let data = new FormData()
    data.append('file', this._$$fileItem.file)
    return $http.post(this._$$url, data, {
      cancelToken,
      onUploadProgress: p => {
        // 进度改变时，刷新块进度
        let progress = p.loaded / p.total * 100
        if (progress > 1) {
          progress--
        }
        this._$$setProgerss(progress)
      }
    }).then(response => {
      return response
    })
  }

  _$$uploadThunk () {
    // 分块上传没有实现
    if (this.state === 'dead') return
    this._$$cancelTokenSource = CancelToken.source()
    let cancelToken = this._$$cancelTokenSource.token
    let data = new FormData()
    data.append('file', this._$$fileItem.file)
    return $http.post(this._$$url, data, {
      cancelToken,
      onUploadProgress: p => {
        // 进度改变时，刷新块进度
        this._$$thunkProgress = p.loaded
        this.onProgress(this._$$fileItem, this.progress)
        this._$$fileItem.progress = this.progress
      }
    }).then(response => {
      this._$$position += this._$$fileItem.file.size
    })
  }

  _$$setProgerss (progress) {
    this._$$progress = progress
    this.onProgress(this._$$fileItem, this.progress)
    this._$$fileItem.progress = this.progress
  }
}

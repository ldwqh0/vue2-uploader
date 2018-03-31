import axios from 'axios'

const $http = axios.create() // 定义一个上传的axios对象
const CancelToken = axios.CancelToken
/**
 * 代表一个上传任务
 */
export default class Task {
  _$$fileItem // 任务的文件
  _$$state // 当前状态,模拟线程的5态 new,runnable,running,blocked,dead
  // _$$chunkProgress = 0
  _$$cancelTokenSource // 取消标记
  _$$progress=0 // 任务进度
  // 分块信息
  _$$position = 0 // 当前的位置
  _$$chunkSize // 任务的分片大小
  _$$chunkIndex=0 // 当前分片的索引号
  _$$chunkCount=0 // 总的分片数
  _$$error = 0 // 分块错误次数
  onProgress (filItem, progress) { }
  onComplete (item) {}
  onSuccess (item, response) {}
  onError (item, error) {}
  constructor ({fileItem, chunkSize = 0, url}) {
    this._$$url = url
    this._$$fileItem = fileItem
    this._$$chunkSize = chunkSize
    this._$$state = 'new'
    if (chunkSize > 0) {
      this._$$chunkCount = Math.ceil(fileItem.file.size / chunkSize)
    }
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
    if (this._$$chunkSize > 0) {
      let response
      while (this._$$position < this._$$fileItem.file.size) { // 依次循环上传
        try {
          response = await this._$$uploadChunk()
          this._$$position += this._$$chunkSize
          this._$$error = 0 // 每次上传成功，充值错误技术
          this._$$chunkIndex++
        } catch (e) {
          if (this._$$error++ >= 10) { // 上传错误超限上传失败,引发事件
            this.onError(this._$$fileItem, e)
            break // 终止循环
          }
        }
      }
      if (this._$$error <= 0) {
        this._$$setProgerss(100) // 完成之后设置进度
        this.onSuccess(this._$$fileItem, response)
      }
    } else {
      try {
        let response = await this._$$uploadFile()
        this._$$setProgerss(100)
        this.onSuccess(this._$$fileItem, response)
      } catch (e) {
        this.onError(this._$$fileItem, e)
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
    })
  }

  _$$uploadChunk () {
    if (this.state === 'dead') return
    this._$$cancelTokenSource = CancelToken.source()
    let cancelToken = this._$$cancelTokenSource.token
    let blob = this._$$fileItem.file.slice(this._$$position, this._$$position + this._$$chunkSize)
    let filename = this._$$fileItem.file.name
    let data = new FormData()
    data.append('file', blob)
    data.append('filename', filename)
    return $http.post(this._$$url, data, {
      headers: {
        'Chunk-Index': this._$$chunkIndex,
        'File-Id': this._$$fileItem.id,
        'Chunk-Count': this._$$chunkCount
      },
      cancelToken,
      onUploadProgress: p => {
        // 进度改变时，刷新块进度
        // this._$$chunkProgress = p.loaded
        let progress = (this._$$position + p.loaded) / this._$$fileItem.file.size * 100
        if (process > 100) {
          progress = 99
        }
        this._$$setProgerss(progress)
      }
    })
  }

  _$$setProgerss (progress) {
    this._$$progress = progress
    this.onProgress(this._$$fileItem, this.progress)
    this._$$fileItem.progress = this.progress
  }
}

import uuid from 'uuid/v1'
import axios from 'axios'

const $http = axios.create() // 定义一个上传的axios对象
const CancelToken = axios.CancelToken

export default class FileItem {
  _$$state='new' // 当前状态,模拟线程的5态 new,runnable,running,blocked,dead
  _$$cancelTokenSource // 取消标记
  _$$progress=0 // 任务进度
  // 分块信息
  _$$position = 0 // 当前的位置
  _$$chunkSize // 任务的分片大小
  _$$chunkIndex=0 // 当前分片的索引号
  _$$chunkCount=0 // 总的分片数
  _$$error = 0 // 分块错误次数
  onProgress (progress) { }
  onComplete () {}
  onSuccess (response) {}
  onError (e) {}
  onStateChanged () {}

  /**
   * 待上传的文件
   */
  file

  /**
   * 获取文件的ID
   */
  get id () {
    return this._$$id
  }

  /**
   * 获取上传进度
   */
  get progress () {
    return this._$$progress
  }

  set progerss (progress) {
    this._$$progress = progress
    this.onProgress(this.progress)
  }

  /**
   * 获取状态
   */
  get state () {
    return this._$$state
  }

  /**
   *
   */
  set state (state) {
    this._$$state = state
    this.onStateChanged(this)
  }

  constructor ({file, url, chunkSize = 0}) {
    this._$$id = uuid()
    this.file = file
    this._$$url = url
    this._$$chunkSize = chunkSize
    if (chunkSize > 0) {
      this._$$chunkCount = Math.ceil(file.size / chunkSize)
    }
  }

   // 执行任务
   async run () {
    if (this.state === 'dead') return
    if (this._$$chunkSize > 0) {
      let response
      while (this._$$position < this.file.size) { // 依次循环上传
        if (this.state === 'dead') return
        try {
          response = await this._$$uploadChunk()
          this._$$position += this._$$chunkSize
          this._$$error = 0 // 每次上传成功，充值错误计数
          this._$$chunkIndex++
        } catch (e) {
          if (this._$$error++ >= 10) { // 上传错误超限上传失败,引发事件
            this.onError(e)
            break // 终止循环
          }
        }
      }
      if (this._$$error <= 0) {
        this.progerss = 100 // 完成之后设置进度
        this.onSuccess(response)
      }
    } else {
      try {
        let response = await this._$$uploadFile()
        this.progerss = 100
        this.onSuccess(response)
      } catch (e) {
        this.onError(e)
      }
    }
    this.onComplete()
    this.state = 'dead' // 标记任务完成
  }

  /**
   * 上传完整的文件，而不是分块上传
   */
  _$$uploadFile () {
    this._$$cancelTokenSource = CancelToken.source()
    let cancelToken = this._$$cancelTokenSource.token
    let data = new FormData()
    data.append('file', this.file)
    return $http.post(this._$$url, data, {
      cancelToken,
      onUploadProgress: p => {
        // 进度改变时，刷新块进度
        let progress = p.loaded / p.total * 100
        if (progress > 1) {
          progress--
        }
        this.progerss = process
      }
    })
  }

  _$$uploadChunk () {
    this._$$cancelTokenSource = CancelToken.source()
    let cancelToken = this._$$cancelTokenSource.token
    let blob = this.file.slice(this._$$position, this._$$position + this._$$chunkSize)
    let filename = this.file.name
    let data = new FormData()
    data.append('file', blob)
    data.append('filename', filename)
    return $http.post(this._$$url, data, {
      headers: {
        'Chunk-Index': this._$$chunkIndex,
        'File-Id': this.id,
        'Chunk-Count': this._$$chunkCount
      },
      cancelToken,
      onUploadProgress: p => {
        // 进度改变时，刷新块进度
        // this._$$chunkProgress = p.loaded
        let progress = (this._$$position + p.loaded) / this.file.size * 100
        if (progress > 100) {
          progress = 99
        }
        this.progerss = progress
      }
    })
  }

  /**
   * 取消上传文件
   */
 /**
   * 取消这个上传任务
   */
  cancel () {
    if (this._$$cancelTokenSource) {
      this._$$cancelTokenSource.cancel('用户取消了上传')// 取消上传
    }
    this.state = 'dead' // 将任务标记为结束
  }
}

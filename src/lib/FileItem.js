import uuid from 'uuid/v1'

export default class FileItem {
  /**
   * 文件上传器，一个fileItem要和一个uploader
   */
  _$$uploader

  progress = 0

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

  constructor ({file, uploader}) {
    this._$$id = uuid() // 文件的唯一标识符，用于各种操作
    this.file = file
    this._$$uploader = uploader
  }

  /**
   *开始上传本文件
   */
  uploadItem () {
     this._$$uploader.uploadItem(this)
  }

  /**
   * 取消上传文件
   */
  cancel () {
    this._$$uploader.cancelItem(this)
  }
}

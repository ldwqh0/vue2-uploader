export default class FileItem {
  static fileIndex = 0 // 文件ID生成器

  /**
   * 文件的进度
   * @type {number}
   */
  progress = 0

  /**
   * 待上传的文件
   */
  file

  /* 文件的状态，有add ,ready, processing, completed, failed新增，就绪，传输中，完成,失败五种状态
   *
   */
  state = 'add'

  get $$index () {
    return this._$$id
  }

  constructor ({file, uploader}) {
    this._$$id = FileItem.fileIndex++ // 文件的唯一标识符，用于各种操作
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

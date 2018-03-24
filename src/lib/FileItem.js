export default class FileItem {
  static fileIndex = 0

  progress = 0

  constructor ({file, autoUpload, uploader}) {
    this.$$id = FileItem.fileIndex++ // 文件的唯一标识符，用于各种操作
    this.file = file
    this.uploader = uploader
    this.state = 'add'// 文件的状态，有add ,ready, processing, completed, failed新增，就绪，传输中，完成,失败五种状态
  }

  /**
   *开始上传本文件
   */
  uploadItem () {
    this.uploader.uploadItem(this)
  }

  /**
   * 取消上传文件
   */
  cancel () {
    this.uploader.cancelItem(this)
  }
}

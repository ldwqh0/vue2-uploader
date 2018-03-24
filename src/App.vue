<template>
  <div id="app">
    <vue-uploader :multiple="true"
                  url="/w/file"
                  @on-add="onAdd"
                  @on-item-progress="itemProgressChanged"
                  @on-item-success="itemSuccess"
                  @on-complete="complete"
                  @on-item-before-upload="beforeUpload"
                  @on-item-cancel="onItemCancel"
                  :auto-upload="true">上传good
    </vue-uploader>
  </div>
</template>

<script>
  import Vue from 'vue'
  import { Component } from 'vue-property-decorator'
  import VueUploader from './components'

  @Component({
    components: {
      VueUploader
    }
  })
  export default class App extends Vue {
    name = 'App'

    mounted () {
      console.log('ddd')
    }

    onAdd (e) {
      console.log('添加文件', e)
    }

    itemProgressChanged (item, p) {
      // console.debug('文件进度改变', item, p)
    }

    itemSuccess (item) {
      // console.debug('文件上传完成', item)
    }

    complete () {
      console.debug('所有文件上传完成')
    }

    onItemCancel (fileItem) {
      console.debug('取消了上传', fileItem)
    }

    beforeUpload (item) {
      console.debug('准备上传文件', item)
    }
  }
</script>
<style lang="less">

</style>

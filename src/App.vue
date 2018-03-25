<template>
  <div id="app">
    <vue-uploader :multiple="true"
                  url="/w/file"
                  @change="onChange"
                  @on-add="onAdd"
                  @on-item-progress="itemProgressChanged"
                  @on-item-success="itemSuccess"
                  @on-item-before-upload="beforeUpload"
                  @on-item-cancel="onItemCancel"
                  @on-complete="complete"
                  :filter="filter"
                  :auto-upload="false">
      <span>上传</span>
    </vue-uploader>
    <table>
      <tr v-for="file in files" :key="file.$$index">
        <td>{{ file.file.name }}</td>
        <td>{{ file.state }}</td>
        <td>{{ file.progress }}</td>
        <td><a href="javascript:void(0);" @click="file.cancel()">删除</a></td>
        <td><a href="javascript:void(0);" @click="file.uploadItem()">上传</a></td>
      </tr>
    </table>
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
    files=[]

    mounted () {
      console.log('ddd')
    }

    onAdd (fileItem) {
      console.log('添加文件', fileItem)
    }

    itemProgressChanged (fileItem, p) {
      console.debug('文件进度改变', fileItem, p)
    }

    itemSuccess (fileItem) {
      console.debug('文件上传完成', fileItem)
    }

    complete () {
      console.debug('所有文件上传完成')
    }

    onChange (files) {
      this.files = files
    }

    onItemCancel (fileItem) {
      console.debug('取消了上传', fileItem)
    }

    beforeUpload (fileItem) {
      console.debug('准备上传文件', fileItem)
    }

    filter (file) {
      return file.name.length > 5
    }
  }
</script>
<style lang="less">

</style>

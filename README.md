# vue2-uploader
一个简单的,基于axios和FormData的Vue上传组件.  
* 由于项目依赖于FormData,因此不支持IE9及以下的IE浏览器(可以尝试其它的shim方案,但不保存能正常使用),其它浏览器的兼容性可以参考相关的浏览器说明
* 需要手动引入[axios](https://github.com/axios/axios)库
* 由于axios依赖于Promise,因此如果要在IE10/IE11+上使用时,需要导入相应的polyfill  

项目中包含一个可运行的示例.
下载项目,通过下列方式运行示例项目
```
npm install && npm run dev
```
## 基本用法
### 导入组件
```
npm install -S vue2-uploader axios
```
如果是IE10/IE11+浏览器,需要引入额外的polyfill
```
npm install -S es6-promise-polyfill
```
### 示例代码
```html
<template>
  <div>
    <vue-uploader :multiple="true"
                  url="/file"
                  @change="change"
                  :auto-upload="false">
      <span>可自定义的上传按钮</span>
    </vue-uploader>
    <table>
      <tr v-for="fileItem in files" :key="file.id">
        <td>{{ fileItem.id }}</td>
        <td>{{ fileItem.file.name }}</td>       
        <td>{{ fileItem.progress }}%</td>
        <td><a href="javascript:void(0);" @click="file.cancel()">删除</a></td>
        <td><a href="javascript:void(0);" @click="file.uploadItem()">上传</a></td>
      </tr>
    </table>
  </div>
</template>
<script>
  import 'es6-promise-polyfill' // 如果使用IE10/IE11+浏览器,需要引入polyfill
  import VueUploader from 'vue2-uploader'
  export default {
    components:{
      VueUploader
    },
    data () {
      return {
        files: []
      }
    },
    methods: {
      change (files) {
        this.files = files
      }
    }
  }
</script>
```
组件提供一个default slot,可以自定义按钮的内容,但组件不提供样式,如果你需要自定义的样式,可以参考src\App.vue中的示例代码
## 组件属性
|属性名称|说名|类型|默认值|
| :- | :- | :- | :- |
|auto-upload|是否自动上传|Boolean|false|
|multiple|是否可以选择多个文件|Boolean|false|
|url|上传地址|String|无(必传项)|
|max-threads|最大同时上传进程数|Number|3|
|name|上传到服务器的参数名称|String|"file"|
|accept|文件选择框允许的文件类型,该属性会用于html的input[type='file']上|String|*|
|filter|文件过滤器,可以是一个正则表达式或者一个函数,当函数返回值为true时,表示通过过滤,函数可以使用的参数为file: File|RegExp, Function|()=>()=>true|
|chunk-size|分块大小|Number|0(为0时不分块)|
## 组件事件
|事件名称|说明|回调参数|参数说明|
| :- | :- | :- | :- |
|on-add|添加文件事件|(fileItem: FileItem)|被添加的文件项|
|change|文件改变事件|(files[]: Files[])|所有的文件项|
|on-complete|所有文件上传完成|无|无|
|on-item-progress|文件上传进度改变事件|(fileItem: FileItem,p)|fileItem: 产生进度改变的文件,p: 进度信息|
|on-item-success|文件上传成功事件|(fileItem: FileItem,response: Response)|上传成功的文件项,服务器响应|
|on-item-cancel|文件取消上传事件|(fileItem: FileItem)|取消的文件项|
|on-item-error|文件上传错误事件|(fileItem: FileItem,error:Error)|错误的文件项,错误信息|
|on-item-complete|文件上传完成（无论成功还是失败都会引发该事件）|(fileItem: FileItem)|完成的文件项|
## FileItem
### FileItem属性
|属性名称|类型|属性说明|
| :- | :- | :-|
|progress|Number|文件上传进度,0-100之间的数值|
|file|File|文件信息|
|id|String|一个只读属性,文件上传前的唯一识别符,在后来的版本中可能修改为文件hash值,可用于循环中的v-for :key标记|
### fileItem的可用方法
|方法名称|说明|
|:-|:-|
|fileItem.upload()|将文件项加入上传队列,加入队列的文件可能不会立即上传|
|fileItem.cancel()|取消上传,取消在队列中的项（包括未开始上传和上传中的文件）,并将文件从files中移除.已经上传的文件不可取消.取消上传中的文件会导致上传项抛出异常,并引发on-item-error事件|
## 分块上传
  在连接不太稳定的网络中,或者服务器的上传限制等原因,我们需要将大文件切割较小的文件块上传到服务器,由服务器组装.  
  我们通过指定组件属性chunk-size指定分块大小.我们通过如下代码将每块指定为4MB
  ```html
    <vue-uploader url="/file" :chunk-size="1024*1024*4"/>
  ```
  ### 分块请求
  在分块上传时,组件会在http header中添加 Chunk-Index,Chunk-Count,File-Id三个头信息,并且会在请求体中增加filename字段用于保存文件名称信息,服务器通过处理这四个信息重新组装文件.
  * File-Id: 针对每次上传,上传文件的唯一识别符,每次上传通过uuid生成  
  * Chunk-Count: 文件分块的总数  
  * Chunk-Index: 当前块的序号  
  组件会依次分块上传每个文件分片,如果某个块上传失败,会尝试重发请求,当重试次数超过十次时,任务会失败
  ### 分块响应
  当组件接收到上一个请求的http Status==2xx后,才会发送下一块.因此,服务器在确认收到块之后,应该返回2xx的响应.  
  组件只有在最后一个块发送完成之后,才会产生上传完成事件,并将服务器的最后一次响应作为事件参数.因此,如果要在代码中使用响应信息,请服务器确保在最后一块中给出完整的响应.  
  在当前的版本中,暂时不支持断点续传,后续会增加相应的续传功能.对响应的要求会有变化.  
  下面是一个使用Spring Boot处理上传的简单示例
  ```java
@SpringBootApplication
@RequestMapping("/file")
public class UploaderApplication {

	// 文件的保存路径
	private String folder = System.getProperty("user.home") + File.separator + "uploads" + File.separator;

	public static void main(String[] args) throws Exception {
		SpringApplication.run(UploaderApplication.class, args);
	}

	@PostMapping
	@ResponseBody
	public String upload(
			@RequestHeader("chunk-index") Long chunkIndex, // 当前块序号
			@RequestHeader("file-id") String tempId, // 文件ID
			@RequestHeader("chunk-count") int chunkCount, // 块总数
			@RequestParam("filename") String filename, // 文件名称
			MultipartHttpServletRequest request,
			HttpServletResponse response) {
		try {
			String chunkname = folder + tempId + "." + chunkIndex; // 保存分块信息的文件名称
			Collection<MultipartFile> files = request.getFileMap().values(); // 获取文件
			MultipartFile mFile = files.iterator().next();
			mFile.transferTo(new File(chunkname)); // 将数据保存到分块文件
			if (chunkIndex == chunkCount - 1) { // 校验索引确定上传是否完成
				String target = folder + filename; // 生成保存的目标文件
				try (OutputStream output = new FileOutputStream(target);) {
					
					// 组装分块文件
					for (int i = 0; i < chunkCount; i++) {
						String sInput = folder + tempId + "." + i;
						File input = new File(sInput);
						FileUtils.copyFile(input, output);
						FileUtils.forceDelete(input); // 删除临时文件
					}
				}
				return target; // 返回保存的文件名
			}
		} catch (Exception e) {
			e.printStackTrace();
			response.setStatus(500); // 如果某块出错，响应错误
		}
		return null;
	}
}
  ```
## 更新历史
* 0.1.1
  修正说明文档中的java代码的错误
* 0.1.0
  新增分块上传功能
* 0.0.9:  
  重新设计的任务模型
  增加docs文档目录
  移除onItemBeforeUpload事件,
  移除fileItem.$$index属性,增加fileItem.id属性,标识文件的唯一性
  移除fileItem的state属性
  
* 0.0.8:  
  增accept属性,可以设置文件类型筛选.  
  修正了一个非自动上传模式下取消文件上传无效的bug.
  更新一个单项上传成功事件不能正确获取响应的问题.
  示例代码中增加一个简单的服务器,可以返回简单响应,去掉原来的测试Proxy.
* 0.0.7:  
  修正filter中的默认值错误
* 0.0.1-0.0.6:  
  初始版本,持续跟进中
## 计划中的功能
* 批量上传功能
* 整体进度显示
* 断点续传
* 修改示例中的上传服务,现有demo中的上传并没有处理/file请求

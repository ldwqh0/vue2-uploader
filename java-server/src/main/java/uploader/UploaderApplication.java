package uploader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Collection;

import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

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

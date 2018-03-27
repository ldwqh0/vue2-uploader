let id = 0
/**
 * 一个简单的测试文件上传的测试文件。
 * 返回的响应为固定的格式
 */
module.exports = (app) => {
    app.post("/file", (req, rsp) => {
        rsp.write(JSON.stringify({
            id: ++id,
            filename: id + '.jpg'
        }))
        rsp.end()
    })
}
const path=require("path")
const bodyParser = require('body-parser').urlencoded({extended:true,uploadDir:path.resolve(__dirname,'..','uploads')})

let id = 0
/**
 * 一个简单的测试文件上传的测试文件。
 * 返回的响应为固定的格式
 */
module.exports = (app) => {
    app.post("/file", bodyParser,(req, rsp) => {
        console.dir(req)
        console.dir(req.files)
        rsp.write(JSON.stringify({
            id: ++id,
            filename: id + '.jpg'
        }))
        rsp.end()
    })
}
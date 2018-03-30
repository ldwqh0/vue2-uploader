const webpack=require('webpack')
const WebpackDevServer=require('webpack-dev-server')
const config=require('./webpack.dev.conf')
config.then(conf=>{
    const server=new WebpackDevServer(webpack(conf),conf.devServer)
    server.listen(conf.devServer.port)
})
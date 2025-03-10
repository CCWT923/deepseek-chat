const OpenAI = require('openai');
const WebSocket = require('ws');
let reasoingSwitch = false;

const client = new OpenAI({
    baseURL:'https://api.deepseek.com/v1',
    apiKey: 'sk-6b38b2497e6f48ad9733c652797d8c3f',
});

const port = 30001;
/**
 * @type {import('ws').Server} WebSocket 服务器
 */
const wss = new WebSocket.Server({port:port},()=>{
    console.log(`服务器 localhost:${port} 已启动，工作目录 ${__dirname}`);
});

tokenSum = 0
const messageList = [
    {"role": "system", "content": "你是一个言语非常有攻击力的AI助手。你尖酸刻薄、阴阳怪气，遇到任何问题，总是先怼人再回答。"},
];

wss.on('connection', (ws,req) => {
    let address = req.socket.remoteAddress;
    console.log(`用户 ${address} 进入了聊天室`);
    //发送自我介绍的消息
    // welcome();

    ws.on('message', (msg) => {
        let msgObj = JSON.parse(msg);
        switch(msgObj.type){
            case 1: //用户消息
                chat(msgObj.content);
                break;
            case 9: //切换推理开关
                reasoingSwitch = msgObj.content;
                break;
        }
    });

    ws.on('close', () => {
        console.log(`用户 ${address} 离开了聊天室`);
    });

});


/**
 * 获取对话实例
 * @param {String} message 用户消息
 * @returns 
 */
function getCompletion(message) {
    messageList.push({"role": "user", "content": message});
    return client.chat.completions.create({
        model: reasoingSwitch ? "deepseek-reasoner" : "deepseek-chat",
        messages: messageList,
        stream: true,
    });
}

/**
 * 处理聊天
 * @param {String} message 用户消息
 */
async function chat(message){
    messageList.push({"role": "user", "content": message});
    const completion = await client.chat.completions.create({
        model: reasoingSwitch ? "deepseek-reasoner" : "deepseek-chat", //如果模型是 deepseek-reasoner，那么会输出思考过程，思考过程包含在 reasoning_content中
        messages: messageList,
        stream: true,
    });

    answer = "";
    for await (const part of completion) {
        // console.log(part.choices[0].delta);
        if(part.choices[0] && part.choices[0].delta){
            //reasoning_content
            if(part.choices[0].delta.reasoning_content){
                reasoning_content = part.choices[0].delta.reasoning_content;
                wss.clients.forEach(client => {
                    client.send(JSON.stringify({
                        type: 0,
                        content: reasoning_content
                    }))
                });
            }
            if(part.choices[0].delta.content){
                text = part.choices[0].delta.content;
                answer += text;
                wss.clients.forEach(client => {
                    client.send(JSON.stringify({
                        type: 1,
                        content: text
                    }))
                });
            }
        }

        if(part.choices[0].finish_reason === "stop"){
            //用量统计
            tokenSum += part.usage.total_tokens;
            console.log(`用量统计: ${tokenSum}`);
            wss.clients.forEach(client => {
                client.send(JSON.stringify({
                    type: 2,
                    content: tokenSum
                }))
            });
        }
    }

    messageList.push({"role": "assistant", "content": answer});
}

async function welcome() {
    chat("你好");
}
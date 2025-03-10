let ws = null;
let messageBox = null;

let newReasoing = true;
let newResponse = true;

let reasoingDiv = null;
let contentDiv = null;

function init() {
    //连接websocket服务器
    ws = new WebSocket("ws://127.0.0.1:30001");

    messageBox = document.getElementById("message-box");

    ws.onopen = function () {
        console.log("WebSocket 连接已打开");
    };

    ws.onmessage = function (event) {
        let dataObj = JSON.parse(event.data);
        if(dataObj.type == 0) { //推理过程
            if(newReasoing){
                reasoingDiv = document.createElement("div");
                reasoingDiv.className = "reasoing-content";
                messageBox.appendChild(reasoingDiv);
                newReasoing = false;
            }
            // reasoingDiv.textContent += dataObj.content;
            reasoingDiv.innerHTML += dataObj.content.replaceAll("\n\n","<br />")
            reasoingDiv.scrollTop = reasoingDiv.scrollHeight;
        }else if(dataObj.type == 1){ //消息内容
            if(newResponse){
                contentDiv = document.createElement("div");
                contentDiv.className = "msg-content";
                messageBox.appendChild(contentDiv);
                newResponse = false;
            }
            // contentDiv.textContent += dataObj.content;
            contentDiv.innerHTML += dataObj.content.replaceAll("\n\n","<br />");
            //滚动到底部
            contentDiv.scrollTop = contentDiv.scrollHeight;
        }else if(dataObj.type == 2){ //Token用量
            //用量统计
            const statusDiv = document.createElement("div");
            statusDiv.className = "status-box";
            statusDiv.textContent = dataObj.content;
            messageBox.appendChild(statusDiv);
            newReasoing = true;
            newResponse = true;
            // console.log(dataObj.content);
        }
    };

    ws.onclose = function () {
        console.log("WebSocket 连接已关闭");
    };
}

let reasoningSwitch = false;

/**
 * 切换推理开关
 */
function switchReasoing(event){
    // console.log(event.target);
    const target = event.target;
    
    if(reasoningSwitch){
        reasoningSwitch = false;
        target.classList.add("reasoning-disabled");
        target.classList.remove("reasoning-enabled");
    }else{
        reasoningSwitch = true;
        target.classList.add("reasoning-enabled");
        target.classList.remove("reasoning-disabled");
    }

    if(ws && ws.readyState == WebSocket.OPEN){
        ws.send(JSON.stringify({
            type: 9,
            content: reasoningSwitch
        }));
    }
}

function sendMsg(event) {
    if(event.keyCode == 13) {
        if(ws.readyState != WebSocket.OPEN){
            alert("WebSocket 连接未打开");
            return;
        }
        //防止添加一个换行符
        event.preventDefault();
        let text = document.getElementById("user-input").value;
        let inputBoxDiv = document.createElement("div");
        inputBoxDiv.className = "user-msg-box";
        let msgDiv = document.createElement("div");
        msgDiv.className = "user-msg-content";
        msgDiv.textContent = text;
        inputBoxDiv.appendChild(msgDiv);
        messageBox.appendChild(inputBoxDiv);
        ws.send(JSON.stringify({
            "type": 1, 
            "content": text
        }));
        document.getElementById("user-input").value = "";
    }
}


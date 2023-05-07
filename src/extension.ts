import * as vscode from "vscode";
import * as https from "https";

export function activate(context: vscode.ExtensionContext) {
  console.log("WordTranslate is activated");

  let disposable = vscode.commands.registerCommand(
    "wordtranslate.helloWorld",
    () => {
      // vscode.window.showInformationMessage('Hello vscode !');
      // 获取当前激活的文本编辑器实例
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        // 获取当前用户选中的文本
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        vscode.window.showInformationMessage(`选中的文本是：${selectedText}`);
      } else {
        vscode.window.showInformationMessage(`当前没有打开的文本编辑器。`);
      }
    }
  );

  let doNotSupport = vscode.commands.registerCommand(
    "wordtranslate.doNotSupport",
    () => {
      vscode.window.showWarningMessage("您当前编辑器不支持此版本插件！");
    }
  );

  // 定义一个HoverProvider
  const hoverProvider = {
    async provideHover(document: any, position: any) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        // 获取当前用户选中的文本
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        if (selectedText) {
					const translation = await translate(selectedText);
					if (translation) {
						return new vscode.Hover("翻译文本：" + translation);
					} else {
						return new vscode.Hover("选择文本：" + selectedText);
					}
        }
      }
    },
  };
  // 注册HoverProvider
  const languageSelector = [{ language: "javascript", scheme: "file" }];
  const showTranslate = vscode.languages.registerHoverProvider(
    languageSelector,
    hoverProvider
  );

	async function translate(text: string) {
    // 百度翻译的 API 地址和 APP ID 与密钥
    const apiEndpoint = "https://fanyi-api.baidu.com/api/trans/vip/translate";
    const appid = "your_own_appid";
    const key = "your_own_key";

    // 设置 API 请求参数
    const sourceLang = "auto";
		const targetLang = "zh";
    const query = text;
    const salt = Math.round(Math.random() * 100000); // 随机数，用于签名
    const sign = baiduSign(query, appid, salt, key);
    const params = `?q=${encodeURIComponent(
      query
    )}&from=${sourceLang}&to=${targetLang}&appid=${appid}&salt=${salt}&sign=${sign}`;

    // 发送 HTTP 请求获取翻译结果
    return new Promise<string | undefined>((resolve, reject) => {
      const req = https.get(apiEndpoint + params, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const result = JSON.parse(data);
          if (result?.trans_result?.length > 0) {
            resolve(result.trans_result[0].dst);
          } else {
            reject("Translation failed!");
          }
        });
      });
			req.on("error", (error) => {
				console.error('error', error);
        reject(error);
      });
    });
  }

  function baiduSign(query: string, appid: string, salt: number, key: string) {
    // 计算百度翻译 API 的签名，用于 API 认证
    const signString = `${appid}${query}${salt}${key}`;
		const md5 = require("md5");
    return md5(signString);
  }

  // 激活时立即运行命令
  // vscode.commands.executeCommand('wordtranslate.autoTranslate');

  // 注销时取消命令
  context.subscriptions.push(showTranslate);
  context.subscriptions.push(doNotSupport);
  context.subscriptions.push(disposable);
}

export function deactivate() {}

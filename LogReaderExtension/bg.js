// 拡張機能の裏方（サービスワーカー）：inject.js から頼まれた通信を WOL-Server に代わりに送る
// 拡張機能自身の通信なので，ページの CORS やローカルネットワークアクセスの制限を受けない（host_permissions が必要）
const BASE = "http://localhost:8080/OpLoRServerPrototype-1.0-SNAPSHOT/";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "getEventSpecs") {    // standard_event.json の取得
        fetch(BASE + "standard_event.json")
            .then(res => res.text())
            .then(text => sendResponse({ ok: true, text: text }))
            .catch(err => sendResponse({ ok: false, error: String(err) }));
        return true;    // 非同期で sendResponse を呼ぶ
    }
    if (msg.type === "sendLog") {          // 操作ログの送信
        fetch(BASE + "HW", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=UTF-8" },   // XMLHttpRequest は自動で UTF-8 にしていた
            body: msg.body
        })
            .then(res => sendResponse({ status: res.status }))
            .catch(err => sendResponse({ status: 0, error: String(err) }));
        return true;
    }
});

//-----リスナーの登録------

// グローバルにイベント仕様を格納する変数
let eventSpecs;

// 外部リソース（eventSpecs）の読み込み
const eventSpecRequest = new XMLHttpRequest();
eventSpecRequest.open("get", "http://localhost:8080/OpLoRServerPrototype-1.0-SNAPSHOT/standard_event.json", true);
eventSpecRequest.send(null);
eventSpecRequest.onreadystatechange = () => {
    // リクエストが完了し、ステータスが200（正常）でない場合は処理を中止
    if (eventSpecRequest.readyState !== 4 || eventSpecRequest.status !== 200) {//正常に通信が終わらない
        return;
    }
    // レスポンスをJSON形式に変換してeventSpecsに格納
    eventSpecs = JSON.parse(eventSpecRequest.responseText);//JSON形式からオブジェクトに
    
    // 取得したeventSpecsを元にイベントリスナーを登録
    for (const eventSpec of eventSpecs) {
		// イベントの種類がターゲットであればログをとる
        if (isTarget(eventSpec)) {//ログをとるイベントかどうか確認
			addEventListenerToAllEventTargets(document, eventSpec); // document全体にリスナーを登録
        }
    }

    // DOM 変化の監視を開始
    observeDOMChanges();
};

// イベント仕様がターゲットに追加するべきかを判断する関数
function isTarget(eventSpec) {
	return !eventSpec.deprecated    // 非推奨ではない
        && !eventSpec.experimental  // 実験的ではない
        && !eventSpec.type.deprecated   // イベントタイプが非推奨ではない
        && !eventSpec.type.experimental // イベントタイプが実験的ではない
}

// DOM要素に対して全てのイベント仕様に基づいてsendEventLogを実行するイベントリスナーを追加する関数
function addEventListenerToAllEventTargets(candidate, eventSpec) {
    // イベントターゲットが無効、またはeventSpecが不正であれば無視
	if (!(candidate instanceof EventTarget) || !eventSpec) {
        return;
    }
    // イベントリスナーを追加
    candidate.addEventListener(eventSpec.name, sendEventLog, false);    // バブリングフェーズでイベントを処理
    
    // 子ノードがあれば再帰的にイベントリスナーを追加
    if (candidate instanceof Node) {
        for (const child of candidate.childNodes) {
            addEventListenerToAllEventTargets(child, eventSpec);
        }
    }
}

// DOM の変更を監視する関数
function observeDOMChanges() {
    observer.observe(document.body, {
        childList: true,    // 子要素の追加や削除を監視
        subtree: true   // 全ての子孫要素を対象に監視
    });
}

// MutationObserver を定義して、DOMの変更を監視するために使用
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        // 'childList' 変更タイプ（子要素の追加や削除）を監視
        if (mutation.type === 'childList') {
            // 追加されたノードに対してイベントリスナーを追加
            for (const addedNode of mutation.addedNodes) {
                if (addedNode instanceof Node) {
                    // すべてのイベント仕様でリスナーを追加
                    for (const eventSpec of eventSpecs) {
                        if (isTarget(eventSpec)) {
                            // 追加されたノードに対してイベントリスナーを登録
                            addEventListenerToAllEventTargets(addedNode, eventSpec);
                        }
                    }
                }
            }
            // 削除されたノードに対してイベントリスナーを削除
            for (const removedNode of mutation.removedNodes) {
                if (removedNode instanceof Node) {
                    removeEventListenersFromElement(removedNode);
                }
            }
        }
    }
});

// 削除されたDOM要素からイベントリスナーを削除する関数
function removeEventListenersFromElement(element) {
    // イベントターゲットでない場合は無視
    if (!(element instanceof EventTarget)) {
        return;
    }
    // 登録されている全てのイベント仕様を元にリスナーを削除
    for (const eventSpec of eventSpecs) {
        if (isTarget(eventSpec)) {
            element.removeEventListener(eventSpec.name, sendEventLog, false);
        }
    }
    // 子ノードがあれば再帰的にイベントリスナーを削除
    if (element instanceof Node) {
        for (const child of element.childNodes) {
            removeEventListenersFromElement(child);
        }
    }
}

//-----イベントハンドラーの動作------

// 送信しないイベントを判断する関数
const ignoredEvents = [
    // マウスイベント
    "mouseenter", "mouseover", "mouseout", "mouseleave", "dblclick",
    "mousedown", "mouseup", "mousemove",
    // ポインターイベント (タッチやペン入力にも対応)
    "pointerenter", "pointerover", "pointerout", "pointerleave", "pointerdown", "pointerup", "pointermove",
    // キーボードイベント
    "keyup", "keydown", "keypress",
    // フォーム関連イベント
    "change", "focus", "blur",
    // ページ関連イベント
    "load"
];

// ログを生成し，送信する関数(イベントハンドラー関数)
function sendEventLog(event) {
    // イベントターゲットが現在のターゲットと異なる場合，処理を中止(操作対象要素のみ操作ログを送信)
    if(event.target !== event.currentTarget) {
        return;
    }

    // 送信しないイベントの場合，処理を中止(対象イベントのみ操作ログを送信)
    if(ignoredEvents.includes(event.type)){
        return;
    }

    const eventDate = new Date();  // 現在の日時を取得
    const json = [];

    let {EventType, json: EventLog} = parseEvent(event, eventDate);    // 戻り値jsonをEventLogとする
    let {NodeType, json: NodeLog} = parseElement(event.target); // 戻り値jsonをEventLogとする
    

    // イベント情報をJSONに追加
    json.push(EventLog);
    
    // 操作対象要素の情報をJSONに追加
    json.push(NodeLog);

    // ログを保持する変数
    let oplorLog = [];

    // JSONデータをログに追加
    oplorLog.push(customStringify(json));
    
    // ログを送信
    sendLog(oplorLog, EventType, NodeType);
}

// ログを送信する関数
function sendLog(oplorLog, EventType, NodeType) {
    // oplorLogsにデータがある場合のみ処理を実行
    if (oplorLog && oplorLog.length > 0){
        // 初期化を行う
        operationLogRequest = init()
        // 初期化処理が成功した場合
		if(operationLogRequest) {
            // ログをコンソールに表示（デバッグ用）
			// console.log("Logs:"+oplorLog.toString());
            // イベント情報と共にログデータを送信
            operationLogRequest.send(EventType+"@@"+NodeType+"@@"+ oplorLog.toString());
        }
    }
}

// ログ送信用のXMLHttpRequestを初期化し，設定する関数
// 初期化が成功した場合はtrueを返す
function init(){
    // XMLHttpRequestオブジェクトの生成
    let operationLogRequest = new XMLHttpRequest();
    
    // HTTPリクエストの設定
	operationLogRequest.open("post", "http://localhost:8080/OpLoRServerPrototype-1.0-SNAPSHOT/HW", true);//開発環境を経由しない場合
    
    // リクエストヘッダーの設定：JSONデータを送信する形式を指定
    operationLogRequest.setRequestHeader("Content-Type", "application/json; charset=ASCII");
    
    // クロスオリジンリクエスト(CORSリクエスト)の際に認証情報を送信する設定
    operationLogRequest.withCredentials=true;

    // リクエストの状態変化に応じた処理
    operationLogRequest.onreadystatechange = () => {
        if (operationLogRequest.readyState === 4) { // リクエスト完了時
            if (operationLogRequest.status === 200) {
                console.log("Log sent successfully.");
            } else if (operationLogRequest.status === 429) {
                console.error("Too Many Requests. Please slow down.");
                return; // `undefined`を返す(if()ではfalseとして扱われる)
            } else {
                console.error(`Failed to send log. Status code: ${operationLogRequest.status}`);
                return;
            }
        }
    }
    return operationLogRequest;
}

// イベントオブジェクトを解析して，対応するJSONを生成する関数
// イベントタイプごとに情報をマージしている
function parseEvent(event, eventDate) {
    let json = {};
    let EventType;
    if (typeof Event === 'function'&&event instanceof Event) {
        EventType='Event';
        json = Object.assign(json, createEventJson(event, eventDate));
    }
    if (typeof UIEvent === 'function'&&event instanceof UIEvent) {
        EventType='UIEvent';
        json = Object.assign(json, createUIEventJson(event));
    }
    // 未実装
    if (typeof FocusEvent === 'function'&&event instanceof FocusEvent) {
        EventType='FocusEvent';
        json = Object.assign(json, createFocusEventJson(event));
    }
    if (typeof MouseEvent === 'function'&&event instanceof MouseEvent) {
        EventType='MouseEvent';
        json = Object.assign(json, createMouseEventJson(event));
    }
    if (typeof TouchEvent === 'function'&&event instanceof TouchEvent) {
        EventType='TouchEvent';
        json = Object.assign(json, createTouchEventJson(event));
    }
    if (typeof CompositionEvent === 'function'&&event instanceof CompositionEvent) {
        EventType='CompositionEvent';
        json = Object.assign(json, createCompositionEventJson(event));
    }
    if (typeof KeyboardEvent === 'function'&&event instanceof KeyboardEvent) {
        EventType='KeyboardEvent';
        json = Object.assign(json, createKeyboardEventJson(event));
    }
    if (typeof WheelEvent === 'function'&&event instanceof WheelEvent) {
        EventType='WheelEvent';
        json = Object.assign(json, createWheelEventJson(event));
    }
    // ※(WOL-Serverに未実装)
    /*
    if(typeof PointerEvent=='function'&&event instanceof PointerEvent){
        EventType='PointerEvent';
        json=Object.assign(json, createPointerEventJson(event));
    }
    */
    if (typeof InputEvent === 'function'&&event instanceof InputEvent) {
        EventType='InputEvent';
        json = Object.assign(json, createInputEventJson(event));
    }
    if (event.type === "selectionchange") {
        EventType='selectionchange';
        json = Object.assign(json, {
            anchorNode: getSelectorFromElement(getSelection().anchorNode).join(" > "),
            anchorOffset: getSelection().anchorOffset,
            focusNode: getSelectorFromElement(getSelection().focusNode).join(" > "),
            focusOffset: getSelection().focusOffset,
            isCollapsed: getSelection().isCollapsed,
            rangeCount: getSelection().rangeCount,
            type: getSelection().type
        });
    }
    return {EventType, json};
}

// イベントオブジェクトから主要な情報を抽出し，JSON形式で返す関数
function createEventJson(event, eventDate) {
    return {
        bubbles: event.bubbles,
        cancelable: event.cancelable,
        composed: event.composed,
        //currentTarget: event.currentTarget,   // WOL-Serverに未実装
        defaultPrevented: event.defaultPrevented,
        eventPhase: event.eventPhase,
        timeStamp: event.timeStamp,
        epochMillis: eventDate.getTime(),
        type: event.type,
        isTrusted: event.isTrusted
    }
}
function createUIEventJson(uiEvent) {
    return {
        detail: uiEvent.detail,
        //view: uiEvent.view    // WOL-Serverに未実装
    }
}
function createPointerEventJson(pointerEvent) { // PointerEvent自体，WOL-Serverに未実装
    return {
    }
}
function createFocusEventJson(focusEvent) {
    return {
        //relatedTarget: focusEvent.relatedTarget   // WOL-Serverに未実装
    }
}
function createMouseEventJson(mouseEvent) {
    return {
        altKey: mouseEvent.altKey,
        button: mouseEvent.button,
        buttons: mouseEvent.buttons,
        clientX: mouseEvent.clientX,
        clientY: mouseEvent.clientY,
        ctrlKey: mouseEvent.ctrlKey,
        metaKey: mouseEvent.metaKey,
        movementX: mouseEvent.movementX,
        movementY: mouseEvent.movementY,
        offsetX: mouseEvent.offsetX,
        offsetY: mouseEvent.offsetY,
        pageX: mouseEvent.pageX,
        pageY: mouseEvent.pageY,
        //relatedTarget: mouseEvent.relatedTarget,  // WOL-Serverに未実装
        screenX: mouseEvent.screenX,
        screenY: mouseEvent.screenY,
        shiftKey: mouseEvent.shiftKey,
        x: mouseEvent.x, //experimental
        y: mouseEvent.y //experimental
    }
}
function createTouchEventJson(event) {
    return {
        altKey: event.altKey,
        //changedTouches: event.changedTouches, // WOL-Serverに未実装
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        //targetTouches: event.targetTouches,   // WOL-Serverに未実装
        //touches: event.touches    // WOL-Serverに未実装
    };
}
function createCompositionEventJson(compositionEvent) {
    return {
        data: composition.data,
        locale: composition.locale
    }
}
function createKeyboardEventJson(keyboardEvent) {
    return {
        altKey: keyboardEvent.altKey,
        code: keyboardEvent.code,
        ctrlKey: keyboardEvent.ctrlKey,
        isComposing: keyboardEvent.isComposing,
        key: keyboardEvent.key,
        location: keyboardEvent.location,
        metaKey: keyboardEvent.metaKey,
        repeat: keyboardEvent.repeat,
        shiftkey: keyboardEvent.shiftKey
    }
}
function createWheelEventJson(event) {
    return {
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaZ: event.deltaZ,
        deltaMode: event.deltaMode
    }
}
function createInputEventJson(event) {
    return {
        data: event.data,
        //dataTransfer: event.dataTransfer, // WOL-Serverに未実装
        inputType: event.inputType,
        isComposing: event.isComposing
    };
}

// 操作対象要素から主要な情報を抽出し，JSON形式で返す関数
// 要素の種類ごとに情報をマージしている
function parseElement(element) {
    let json = {};
    let NodeType
    if (typeof Node === 'function'&&element instanceof Node) {
        NodeType='Node';
        json = Object.assign(json, createNodeJson(element));
    }
    if (typeof Document === 'function'&&element instanceof Document) {
        NodeType='Document';
        json = Object.assign(json, createDocumentJson(element));
    }
    if (typeof Element === 'function'&&element instanceof Element) {
        NodeType='Element';
        json = Object.assign(json, createElementJson(element));
    }
    if (typeof CharacterData === 'function'&&element instanceof CharacterData) {
        NodeType='CharacterData';
        json = Object.assign(json, createCharacterDataJson(element));
    }
    if (typeof Text === 'function'&&element instanceof Text) {
        NodeType='Text';
        json = Object.assign(json, createTextJson(element));
    }
    /*  // WOL-Serverに未実装(クラスはあるが，内容が記述されていない)
    if (typeof DocumentFragment === 'function'&&element instanceof DocumentFragment) {
        NodeType='DocumentFragment';
        json = Object.assign(json, createDocumentFragmentJson(element));
    }
    */
    if (typeof DocumentType === 'function'&&element instanceof DocumentType) {
        NodeType='DocumentType';
        json = Object.assign(json, createDocumentTypeJson(element));
    }
    if (typeof HTMLElement === 'function'&&element instanceof HTMLElement) {
        NodeType='HTMLElement';
        json = Object.assign(json, createHTMLElementJson(element));
    }
    /*  // WOL-Serverに未実装
    if (typeof SVGElement === 'function'&&element instanceof SVGElement) {
        NodeType='SVGElement';
        json = Object.assign(json, createSVGElementJson(element));
    }
    */
    if (typeof HTMLAbchorElement === 'function'&&element instanceof HTMLAnchorElement) {
        NodeType='HTMLAnchorElement';
        json = Object.assign(json, createHTMLAnchorElementJson(element));
    }
    if (typeof HTMLAreaElement === 'function'&&element instanceof HTMLAreaElement) {
        NodeType='HTMLAreaElement';
        json = Object.assign(json, createHTMLAreaElementJson(element));
    }
    if (typeof HTMLBaseElement === 'function'&&element instanceof HTMLBaseElement) {
        NodeType='HTMLBaseElement';
        json = Object.assign(json, createHTMLBaseElementJson(element));
    }
    if (typeof HTMLButtonElement === 'function'&&element instanceof HTMLButtonElement) {
        NodeType='HTMLButtonElement';
        json = Object.assign(json, createHTMLButtonElementJson(element));
    }
    if (typeof HTMLCanvasElement === 'function'&&element instanceof HTMLCanvasElement) {
        NodeType='HTMLCanvasElement';
        json = Object.assign(json, createHTMLCanvasElementJson(element));
    }
    if (typeof HTMLDataElement === 'function'&&element instanceof HTMLDataElement) {
        NodeType='HTMLDataElement';
        json = Object.assign(json, createHTMLDataElementJson(element));
    }
    /*  // WOL-Serverに未実装(クラスはあるが，内容が記述されていない)
    if (typeof HTMLDataListElement === 'function'&&element instanceof HTMLDataListElement) {
        NodeType='HTMLDataListElement';
        json = Object.assign(json, createHTMLDataListElementJson(element));
    }
    */
    if (typeof HTMLDialogElement === 'function'&&element instanceof HTMLDialogElement) {
        NodeType='HTMLDialogElement';
        json = Object.assign(json, createHTMLDialogElementJson(element));
    }
    if (typeof HTMLEmbedElement === 'function'&&element instanceof HTMLEmbedElement) {
        NodeType='HTMLEmbedElement';
        json = Object.assign(json, createHTMLEmbedElementJson(element));
    }
    if (typeof HTMLFieldSetElement === 'function'&&element instanceof HTMLFieldSetElement) {
        NodeType='HTMLFieldSetElement';
        json = Object.assign(json, createHTMLFieldSetElementJson(element));
    }
    if (typeof HTMLFormElement === 'function'&&element instanceof HTMLFormElement) {
        NodeType='HTMLFormElement';
        json = Object.assign(json, createHTMLFormElementJson(element));
    }
    if (typeof HTMLIFrameElement === 'function'&&element instanceof HTMLIFrameElement) {
        NodeType='HTMLIFrameFormElement';
        json = Object.assign(json, createHTMLIFrameElementJson(element));
    }
    if (typeof HTMLInputElement === 'function'&&element instanceof HTMLInputElement) {
        NodeType='HTMLInputElement';
        json = Object.assign(json, createHTMLInputElementJson(element));
    }
    if (typeof HTMLLIElement === 'function'&&element instanceof HTMLLIElement) {
        NodeType='HTMLLIElement';
        json = Object.assign(json, createHTMLLIElementJson(element));
    }
    if (typeof HTMLLabelElement === 'function'&&element instanceof HTMLLabelElement) {
        NodeType='HTMLLabelElement';
        json = Object.assign(json, createHTMLLabelElementJson(element));
    }
    if (typeof HTMLLegendElement === 'function'&&element instanceof HTMLLegendElement) {
        NodeType='HTMLLegend';
        json = Object.assign(json, createHTMLLegendElementJson(element));
    }
    if (typeof HTMLLinkElement === 'function'&&element instanceof HTMLLinkElement) {
        NodeType='HTMLLinkElement';
        json = Object.assign(json, createHTMLLinkElementJson(element));
    }
    if (typeof HTMLMapElement === 'function'&&element instanceof HTMLMapElement) {
        NodeType='HTMLMapElement';
        json = Object.assign(json, createHTMLMapElementJson(element));
    }
    if (typeof HTMLMediaElement === 'function'&&element instanceof HTMLMediaElement) {
        NodeType='HTMLMediaElement';
        json = Object.assign(json, createHTMLMediaElementJson(element));
    }
    if (typeof HTMLMetaElement === 'function'&&element instanceof HTMLMetaElement) {
        NodeType='HTMLMetaElement';
        json = Object.assign(json, createHTMLMetaElementJson(element));
    }
    if (typeof HTMLMeterElement === 'function'&&element instanceof HTMLMeterElement) {
        NodeType='HTMLMeterElement';
        json = Object.assign(json, createHTMLMeterElementJson(element));
    }
    if (typeof HTMLModElement === 'function'&&element instanceof HTMLModElement) {
        NodeType='HTMLModElement';
        json = Object.assign(json, createHTMLModElementJson(element));
    }
    if (typeof HTMLOListElement === 'function'&&element instanceof HTMLOListElement) {
        NodeType='HTMLOListElement';
        json = Object.assign(json, createHTMLOListElementJson(element));
    }
    if (typeof HTMLObjectElement === 'function'&&element instanceof HTMLObjectElement) {
        NodeType='HTMLPbjectElement';
        json = Object.assign(json, createHTMLObjectElementJson(element));
    }
    if (typeof HTMLOptGroupElement === 'function'&&element instanceof HTMLOptGroupElement) {
        NodeType='HTMLOptGroupElement';
        json = Object.assign(json, createHTMLOptGroupElementJson(element));
    }
    if (typeof HTMLOptionElement === 'function'&&element instanceof HTMLOptionElement) {
        NodeType='HTMLOptionElement';
        json = Object.assign(json, createHTMLOptionElementJson(element));
    }
    if (typeof HTMLOutputElement === 'function'&&element instanceof HTMLOutputElement) {
        NodeType='HTMLOutputElement';
        json = Object.assign(json, createHTMLOutputElementJson(element));
    }
    if (typeof HTMLParamElement === 'function'&&element instanceof HTMLParamElement) {
        NodeType='HTMLParamElement';
        json = Object.assign(json, createHTMLParamElementJson(element));
    }
    if (typeof HTMLProgressElement === 'function'&&element instanceof HTMLProgressElement) {
        NodeType='HTMLProgressElement';
        json = Object.assign(json, createHTMLProgressElementJson(element));
    }
    if (typeof HTMLQuoteElement === 'function'&&element instanceof HTMLQuoteElement) {
        NodeType='HTMLQuoteElement';
        json = Object.assign(json, createHTMLQuoteElementJson(element));
    }
    if (typeof HTMLScriptElement === 'function'&&element instanceof HTMLScriptElement) {
        NodeType='HTMLScriptElement';
        json = Object.assign(json, createHTMLScriptElementJson(element));
    }
    if (typeof HTMLSelectElement === 'function'&&element instanceof HTMLSelectElement) {
        NodeType='HTMLSelectElement';
        json = Object.assign(json, createHTMLSelectElementJson(element));
    }
    if (typeof HTMLSlotElement === 'function'&&element instanceof HTMLSlotElement) {
        NodeType='HTMLSlotElement';
        json = Object.assign(json, createHTMLSlotElementJson(element));
    }
    if (typeof HTMLSourceElement === 'function'&&element instanceof HTMLSourceElement) {
        NodeType='HTMLSourceElement';
        json = Object.assign(json, createHTMLSourceElementJson(element));
    }
    if (typeof HTMLStyleElement === 'function'&&element instanceof HTMLStyleElement) {
        NodeType='HTMLStyleElement';
        json = Object.assign(json, createHTMLStyleElementJson(element));
    }
    if (typeof HTMLTableCellElement === 'function'&&element instanceof HTMLTableCellElement) {
        NodeType='HTMLTableCellElement';
        json = Object.assign(json, createHTMLTableCellElementJson(element));
    }
    if (typeof HTMLTableColElement === 'function'&&element instanceof HTMLTableColElement) {
        NodeType='HTMLTableColElement';
        json = Object.assign(json, createHTMLTableColElementJson(element));
    }
    if (typeof HTMLTableElement === 'function'&&element instanceof HTMLTableElement) {
        NodeType='HTMLTableElement';
        json = Object.assign(json, createHTMLTableElementJson(element));
    }
    if (typeof HTMLTableRowElement === 'function'&&element instanceof HTMLTableRowElement) {
        NodeType='HTMLTableRowElement';
        json = Object.assign(json, createHTMLTableRowElementJson(element));
    }
    /*  // WOL-Serverに未実装(クラスはあるが，内容が記述されていない)
    if (typeof HTMLTableSectionElement === 'function'&&element instanceof HTMLTableSectionElement) {
        NodeType='HTMLTableSectionElement';
        json = Object.assign(json, createHTMLTableSectionElementJson(element));
    }
    */
   /*  // WOL-Serverに未実装(クラスはあるが，内容が記述されていない)
    if (typeof HTMLTemplateElement === 'function'&&element instanceof HTMLTemplateElement) {
        NodeType='HTMLTemplateElement';
        json = Object.assign(json, createHTMLTemplateElementJson(element));
    }
    */
    if (typeof HTMLTextAreaElement === 'function'&&element instanceof HTMLTextAreaElement) {
        NodeType='HTMLTextAreaElement';
        json = Object.assign(json, createHTMLTextAreaElementJson(element));
    }
    if (typeof HTMLTimeElement === 'function'&&element instanceof HTMLTimeElement) {
        NodeType='HTMLTimeElement';
        json = Object.assign(json, createHTMLTimeElementJson(element));
    }
    if (typeof HTMLTitleElement === 'function'&&element instanceof HTMLTitleElement) {
        NodeType='HTMLTitleElement';
        json = Object.assign(json, createHTMLTitleElementJson(element));
    }
    if (typeof HTMLTrackElement === 'function'&&element instanceof HTMLTrackElement) {
        NodeType='HTMLTrackElement';
        json = Object.assign(json, createHTMLTrackElementJson(element));
    }
    if (typeof HTMLVideoElement === 'function'&&element instanceof HTMLVideoElement) {
        NodeType='HTMLVideoElement';
        json = Object.assign(json, createHTMLVideoElementJson(element));
    }
    return {NodeType, json};
}

// 操作対象要素から主要な情報を抽出し，JSON形式で返す関数
function createNodeJson(node) {
    return {
        baseURI: node.baseURI,
        //childNodes: node.childNodes,  // WOL-Serverで未実装
        //firstChild: node.firstChild,  // WOL-Serverで未実装
        innerText: node.innerText,
        //lastChild: node.lastChild,    // WOL-Serverで未実装
        //nextSibling: node.nextSibling,    // WOL-Serverで未実装
        nodeName: node.nodeName,
        //nodeType: node.nodeType,  // WOL-Serverで未実装
        nodeValue: node.nodeValue,
        //ownerDocument: node.ownerDocument,    // WOL-Serverで未実装
        //parentNode: node.parentNode,  // WOL-Serverで未実装
        //parentElement: node.parentElement,    // WOL-Serverで未実装
        //previousSibling: node.previousSibling,    // WOL-Serverで未実装
		textContent: node.textContent
    };
}
function createDocumentJson(document) {
    return {
        characterSet: document.characterSet,
        compatMode: document.compatMode,
        contentType: document.contentType,
        //doctype: document.doctype,    // 直接シリアライズできない
        //documentElement: document.documentElement,    // WOL-Serverで未実装
        //documentURI: document.documentURI,    // 直接シリアライズできない場合あり
        hidden: document.hidden,
        //implementation: document.implementation, // WOL-Serverで未実装
        //lastStyleSheetSet: document.lastStyleSheetSet,    // WOL-Serverで未実装
        //pointerLockElement: document.pointerLockElement,  // WOL-Serverで未実装
        //preferredStyleSheetSet: document.preferredStyleSheetSet,  // WOL-Serverで未実装
        //scrollingElement: document.scrollingElement,  // WOL-Serverで未実装
        selectedStyleSheetSet: document.selectedStyleSheetSet,
        //styleSheets: document.styleSheets,    // WOL-Serverで未実装
        //styleSheetSets: document.styleSheetSets,  // WOL-Serverで未実装
        //timeline: document.timeline,  // WOL-Serverで未実装
        //undoManager: document.undoManager,    //experimental&WOL-Serverで未実装
        visibilityState: document.visibilityState,
        //children: document.children, // WOL-Serverで未実装
        //firstElementChild: document.firstElementChild, // WOL-Serverで未実装
        //lastElementChild: document.lastElementChild, // WOL-Serverで未実装
        //childElementCount: document.childElementCount, // WOL-Serverで未実装
        //activeElement: document.activeElement,    // WOL-Serverで未実装
        //activeElementSelector: getSelectorFromElement(document.activeElement),    // WOL-Serverで未実装
        //anchors: document.anchors,    // WOL-Serverで未実装
        //body: document.body,  // WOL-Serverで未実装
        cookie: document.cookie,
        //defaultView: document.defaultView,    // WOL-Serverで未実装
        designMode: document.designMode,
        dir: document.dir,
        domain: document.domain,
        //embeds: document.embeds,  // WOL-Serverで未実装
        //forms: document.forms,    // WOL-Serverで未実装
        //head: document.head,  // WOL-Serverで未実装
        //images: document.images,  // WOL-Serverで未実装
        lastModified: document.lastModified,
        //links: document.links,    // WOL-Serverで未実装
        //location: document.location,  // 直接シリアライズできない
        //plugins: document.plugins,    // WOL-Serverで未実装
        readyState: document.readyState,
        referrer: document.referrer,
        //scripts: document.scripts,    // WOL-Serverで未実装
        title: document.title,
        URL: document.URL,
    };
}
function createElementJson(element) {
    return {
        selector: getSelectorFromElement(element).join(" > "),
        //assignedSlot: element.assignedSlot,   // WOL-Serverで未実装
        //attributes: element.attributes,   // WOL-Serverで未実装
        //classList: element.classList, // WOL-Serverで未実装
        className: element.className,
        clientHeight: element.clientHeight,
        clientLeft: element.clientLeft,
        clientTop: element.clientTop,
        clientWidth: element.clientWidth,
        computedName: element.computedName,
        computedRole: element.computedRole,
        id: element.id,
        innerHTML: element.innerHTML,
        localName: element.localName,
        namespaceURI: element.namespaceURI,
        //nextElementSibling: element.nextElementSibling,   // WOL-Serverで未実装
        outerHTML: element.outerHTML,
        prefix: element.prefix,
        //previousElementSibling: element.previousElementSibling,   // WOL-Serverで未実装
        scrollHeight: element.scrollHeight,
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop,
        scrollWidth: element.scrollWidth,
        //shadowRoot: element.shadowRoot,   // WOL-Serverで未実装
        slot: element.slot,
        tagName: element.tagName,
        //undoManager: element.undoManager, // WOL-Serverで未実装
        //undoScope: element.undoScope    // WOL-Serverで未実装
    };
}
function createCharacterDataJson(characterData) {
    return {
        data: characterData.data,
        length: characterData.length,
        //nextElementSibling: characterData.nextElementSibling, // WOL-Serverで未実装
        //previousElementSibling: characterData.previousElementSibling  // WOL-Serverで未実装
    };
}
function createTextJson(text) {
    return {
        wholeText: text.wholeText,
        //assignedSlot: text.assignedSlot   // WOL-Serverで未実装
    };
}
function createDocumentFragmentJson(documentFragment) {
    return {
        children: documentFragment.children,
        //firstElementChild: documentFragment.firstElementChild,    // 直接シリアライズできない
        //lastElementChild: documentFragment.lastElementChild,  // 直接シリアライズできない
        childElementCount: documentFragment.childElementCount
    };
}
function createDocumentTypeJson(documentType) {
    return {
        name: documentType.name,
        publicId: documentType.publicId,
        systemId: documentType.systemId
    };
}
function createHTMLElementJson(htmlElement) {
    return {
        accessKey: htmlElement.accessKey,
        accessKeyLabel: htmlElement.accessKeyLabel,
        contentEditable: htmlElement.contentEditable,
        isContentEditable: htmlElement.isContentEditable,
        //contextMenu: htmlElement.contextMenu, // WOL-Serverで未実装
        //dataset: htmlElement.dataset, // WOL-Serverで未実装
        //dir: htmlElement.dir, // WOL-Serverで未実装
        draggable: htmlElement.draggable,
        //dropzone: htmlElement.dropzone,   dropzone: htmlElement.dropzone,
        hidden: htmlElement.hidden,
        itemScope: htmlElement.itemScope, //experimental
        //itemType: htmlElement.itemType,   // WOL-Serverで未実装
        itemId: htmlElement.itemId, //experimental
        //itemRef: htmlElement.itemRef, // WOL-Serverで未実装
        //itemProp: htmlElement.itemProp,   // WOL-Serverで未実装
        //itemValue: htmlElement.itemValue, // WOL-Serverで未実装
        lang: htmlElement.lang,
        offsetHeight: htmlElement.offsetHeight,
        offsetLeft: htmlElement.offsetLeft,
        //offsetParent: htmlElement.offsetParent,   // WOL-Serverで未実装
        offsetTop: htmlElement.offsetTop,
        offsetWidth: htmlElement.offsetWidth,
        //properties: htmlElement.properties,   // WOL-Serverで未実装
        spellcheck: htmlElement.spellcheck,
        //style: htmlElement.style, // 直接シリアライズできない
        tabIndex: htmlElement.tabIndex,
		title: htmlElement.title,
        translate: htmlElement.translate
    };
}
function createSVGElementJson(svgElement) {
    return {
        dataset: svgElement.dataset,
        id: svgElement.id
        //ownerSVGElement: svgElement.ownerSVGElement
    };
}
function createHTMLAnchorElementJson(htmlAnchorElement) {
    return {
        download: htmlAnchorElement.download,
        hash: htmlAnchorElement.hash,
        host: htmlAnchorElement.host,
        hostname: htmlAnchorElement.hostname,
        href: htmlAnchorElement.href,
        hreflang: htmlAnchorElement.hreflang,
        media: htmlAnchorElement.media,
        password: htmlAnchorElement.password,
        origin: htmlAnchorElement.origin,
        pathname: htmlAnchorElement.pathname,
        port: htmlAnchorElement.port,
        protocol: htmlAnchorElement.protocol,
        referrerPolicy: htmlAnchorElement.referrerPolicy,
        rel: htmlAnchorElement.rel,
        //relList: htmlAnchorElement.relList,   // WOL-Serverで未実装
        search: htmlAnchorElement.search,
        target: htmlAnchorElement.target,
        text: htmlAnchorElement.text,
        type: htmlAnchorElement.type,
        username: htmlAnchorElement.username
    };
}
function createHTMLAreaElementJson(htmlAreaElement) {
    return {
        alt: htmlAreaElement.alt,
        coords: htmlAreaElement.coords,
        download: htmlAreaElement.download,
        hash: htmlAreaElement.hash,
        host: htmlAreaElement.host,
        hostname: htmlAreaElement.hostname,
        //href: htmlAreaElement.href,   // WOL-Serverで未実装
        //hreflang: htmlAreaElement.hreflang,   // WOL-Serverで未実装
        media: htmlAreaElement.media,
        password: htmlAreaElement.password,
        origin: htmlAreaElement.origin,
        pathname: htmlAreaElement.pathname,
        port: htmlAreaElement.port,
        protocol: htmlAreaElement.protocol,
        referrerPolicy: htmlAreaElement.referrerPolicy, //experimental
        rel: htmlAreaElement.rel,
        //relList: htmlAreaElement.relList, // WOL-Serverで未実装
        search: htmlAreaElement.search,
        shape: htmlAreaElement.shape,
        target: htmlAreaElement.target,
        type: htmlAreaElement.type,
        username: htmlAreaElement.username
    };
}
function createHTMLBaseElementJson(htmlBaseElement) {
    return {
        href: htmlBaseElement.href,
        target: htmlBaseElement.target
    };
}
function createHTMLButtonElementJson(htmlButtonElement) {
    return {
        autofocus: htmlButtonElement.autofocus,
        disabled: htmlButtonElement.disabled,
        //form: htmlButtonElement.form, // WOL-Serverで未実装
        //formSelector: getSelectorFromElement(htmlButtonElement.form).join(" > "), // WOL-Serverで未実装
        formAction: htmlButtonElement.formAction,
        formEnctype: htmlButtonElement.formEnctype,
        formMethod: htmlButtonElement.formMethod,
        formNoValidate: htmlButtonElement.formNoValidate,
        formTarget: htmlButtonElement.formTarget,
        //labels: htmlButtonElement.labels, // WOL-Serverで未実装
        //menu: htmlButtonElement.menu, // WOL-Serverで未実装
        name: htmlButtonElement.name,
        type: htmlButtonElement.type,
        validationMessage: htmlButtonElement.validationMessage,
        //validity: htmlButtonElement.validity, // WOL-Serverで未実装
        value: htmlButtonElement.value,
        willValidate: htmlButtonElement.willValidate
    };
}
function createHTMLCanvasElementJson(htmlCanvasElement) {
    return {
        height: htmlCanvasElement.height,
        width: htmlCanvasElement.width
    };
}
function createHTMLDataElementJson(htmlDataElement) {
    return {
        value: htmlDataElement.value
    };
}
function createHTMLDataListElementJson(htmlDataListElement) {
    return {
        options: htmlDataListElement.options
    };
}
function createHTMLDialogElementJson(htmlDialogElement) {
    return {
        open: htmlDialogElement.open,
        returnValue: htmlDialogElement.returnValuef
    };
}
function createHTMLEmbedElementJson(htmlEmbedElement) {
    return {
        height: htmlEmbedElement.height,
        src: htmlEmbedElement.src,
        type: htmlEmbedElement.type,
        width: htmlEmbedElement.width
    };
}
function createHTMLFieldSetElementJson(htmlFieldSetElement) {
    return {
        disabled: htmlFieldSetElement.disabled,
        //elements: htmlFieldSetElement.elements, // 直接シリアライズできない
        //form: htmlFieldSetElement.form,   // WOL-Serverに未実装
        //formSelector: getSelectorFromElement(htmlFieldSetElement.form).join(" > "),   // WOL-Serverに未実装
        name: htmlFieldSetElement.name,
        type: htmlFieldSetElement.type,
        validationMessage: htmlFieldSetElement.validationMessage,
        //validity: htmlFieldSetElement.validity,   // WOL-Serverに未実装
        willValidate: htmlFieldSetElement.willValidate
    };
}
function createHTMLFormElementJson(htmlFormElement) {
    return {
        //elements: htmlFormElement.elements,   // WOL-Serverに未実装
        length: htmlFormElement.length,
        //name: htmlFormElement.name,   // 直接シリアライズできない
        method: htmlFormElement.method,
        target: htmlFormElement.target,
        action: htmlFormElement.action,
        encoding: htmlFormElement.encoding,
        enctype: htmlFormElement.enctype,
        acceptCharset: htmlFormElement.acceptCharset,
        autocomplete: htmlFormElement.autocomplete,
        noValidate: htmlFormElement.noValidate
    };
}
function createHTMLIFrameElementJson(htmlIFrameElement) {
    return {
        allow: htmlIFrameElement.allow,
        allowFullscreen: htmlIFrameElement.allowFullscreen,
        allowPaymentRequest: htmlIFrameElement.allowPaymentRequest,
        //contentDocument: htmlIFrameElement.contentDocument,   // WOL-Serverに未実装
        //contentWindow: htmlIFrameElement.contentWindow,   // WOL-Serverに未実装
        height: htmlIFrameElement.height,
        name: htmlIFrameElement.name,
        referrerPolicy: htmlIFrameElement.referrerPolicy,
        //sandbox: htmlIFrameElement.sandbox,   // WOL-Serverに未実装
        src: htmlIFrameElement.src,
        srcdoc: htmlIFrameElement.srcdoc,
        width: htmlIFrameElement.width
    };
}
function createHTMLInputElementJson(htmlInputElement) {
   return {
        //form: htmlInputElement.form,  // WOL-Serverに未実装
        //formSelector: getSelectorFromElement(htmlInputElement.form).join(" > "),  // WOL-Serverに未実装
        formAction: htmlInputElement.formAction,
        formEncType: htmlInputElement.formEncType,
        formMethod: htmlInputElement.formMethod,
        formNoValidate: htmlInputElement.formNoValidate,
        formTarget: htmlInputElement.formTarget,
        name: htmlInputElement.name,
        type: htmlInputElement.type,
        disabled: htmlInputElement.disabled,
        autofocus: htmlInputElement.autofocus,
        required: htmlInputElement.required,
        value: htmlInputElement.value,
        //validity: htmlInputElement.validity,  // WOL-Serverに未実装
        validationMessage: htmlInputElement.validationMessage,
        willValidate: htmlInputElement.willValidate,
        checked: htmlInputElement.checked,
        defaultChecked: htmlInputElement.defaultChecked,
        indeterminate: htmlInputElement.indeterminate,
        alt: htmlInputElement.alt,
        height: htmlInputElement.height,
        src: htmlInputElement.src,
        width: htmlInputElement.width,
        accept: htmlInputElement.accept,
        //files: htmlInputElement.files,    // WOL-Serverに未実装
        autocomplete: htmlInputElement.autocomplete,
        maxLength: htmlInputElement.maxLength,
        size: htmlInputElement.size,
        pattern: htmlInputElement.pattern,
        placeholder: htmlInputElement.placeholder,
        readOnly: htmlInputElement.readOnly,
        min: htmlInputElement.min,
        max: htmlInputElement.max,
        selectionStart: htmlInputElement.selectionStart,
        selectionEnd: htmlInputElement.selectionEnd,
        selectionDirection: htmlInputElement.selectionDirection,
        defaultValue: htmlInputElement.defaultValue,
        dirName: htmlInputElement.dirName,
        //list: htmlInputElement.list,  // WOL-Serverに未実装
        multiple: htmlInputElement.multiple,
        //labels: htmlInputElement.labels,  // WOL-Serverに未実装
        step: htmlInputElement.step,
        //valueAsDate: htmlInputElement.valueAsDate,    // WOL-Serverに未実装
        valueAsNumber: htmlInputElement.valueAsNumber,
        autocapitalize: htmlInputElement.autocapitalize
    };
}
function createHTMLLIElementJson(htmlLiElement) {
    return {
        value: htmlLiElement.value
    };
}
function createHTMLLabelElementJson(htmlLabelElement) {
    return {
        //control: htmlLabelElement.control,    // 直接シリアライズできない場合あり
        //form: htmlLabelElement.form,  // WOL-Serverに未実装
        //formSelector: getSelectorFromElement(htmlLabelElement.form).join(" > "),  // WOL-Serverに未実装
        htmlFor: htmlLabelElement.htmlFor,
    };
}
function createHTMLLegendElementJson(htmlLegendElement) {
    return {
        //form: htmlLegendElement.form, // WOL-Serverに未実装
        //formSelector: getSelectorFromElement(htmlLegendElement.form).join(" > "), // WOL-Serverに未実装
    };
}
function createHTMLLinkElementJson(htmlLinkElement) {
    return {
        as: htmlLinkElement.as,
        crossOrigin: htmlLinkElement.crossOrigin,
        disabled: htmlLinkElement.disabled,
        href: htmlLinkElement.href,
        hreflang: htmlLinkElement.hreflang,
        media: htmlLinkElement.media,
        referrerPolicy: htmlLinkElement.referrerPolicy,
        rel: htmlLinkElement.rel,
        //relList: htmlLinkElement.relList, // 直接シリアライズできない
        //sizes: htmlLinkElement.sizes, // 直接シリアライズできない
        //sheet: htmlLinkElement.sheet, // 直接シリアライズできない
        type: htmlLinkElement.type
    };
}
function createHTMLMapElementJson(htmlMapElement) {
    return {
        name: htmlMapElement.name,
        //areas: htmlMapElement.areas,  // WOL-Serverに未実装
        //images: htmlMapElement.images // WOL-Serverに未実装
    };
}
function createHTMLMediaElementJson(htmlMediaElement) {
    return {
        //audioTracks: htmlMediaElement.audioTracks,    // WOL-Serverに未実装
        autoplay: htmlMediaElement.autoplay,
        //buffered: htmlMediaElement.buffered,  // WOL-Serverに未実装
        //controller: htmlMediaElement.controller,  // WOL-Serverに未実装
        //controls: htmlMediaElement.controls,    // 直接シリアライズできない場合あり
        //controlsList: htmlMediaElement.controlsList,  // WOL-Serverに未実装
        crossOrigin: htmlMediaElement.crossOrigin,
        currentSrc: htmlMediaElement.currentSrc,
        currentTime: htmlMediaElement.currentTime,
        defaultMuted: htmlMediaElement.defaultMuted,
        defaultPlaybackRate: htmlMediaElement.defaultPlaybackRate,
        disableRemotePlayback: htmlMediaElement.disableRemotePlayback,
        duration: htmlMediaElement.duration,
        ended: htmlMediaElement.ended,
        //error: htmlMediaElement.error,    // WOL-Serverに未実装
        loop: htmlMediaElement.loop,
        mediaGroup: htmlMediaElement.mediaGroup,
        //mediaKeys: htmlMediaElement.mediaKeys,    // WOL-Serverに未実装
        muted: htmlMediaElement.muted,
        networkState: htmlMediaElement.networkState,
        paused: htmlMediaElement.paused,
        playbackRate: htmlMediaElement.playbackRate,
        //played: htmlMediaElement.played,  // WOL-Serverに未実装
        preload: htmlMediaElement.preload,
        readyState: htmlMediaElement.readyState,
        //seekable: htmlMediaElement.seekable,  // WOL-Serverに未実装
        seeking: htmlMediaElement.seeking,
        sinkId: htmlMediaElement.sinkId,
        src: htmlMediaElement.src,
        //srcObject: htmlMediaElement.srcObject,    // WOL-Serverに未実装
        //textTracks: htmlMediaElement.textTracks,  // WOL-Serverに未実装
        //videoTracks: htmlMediaElement.videoTracks,    // WOL-Serverに未実装
        volume: htmlMediaElement.volume
    };
}
function createHTMLMetaElementJson(htmlMetaElement) {
    return {
        content: htmlMetaElement.content,
        httpEquiv: htmlMetaElement.httpEquiv,
        name: htmlMetaElement.name
    };
}
function createHTMLMeterElementJson(htmlMeterElement) {
    return {
        high: htmlMeterElement.high,
        low: htmlMeterElement.low,
        max: htmlMeterElement.max,
        min: htmlMeterElement.min,
        optimum: htmlMeterElement.optimum,
        //labels: htmlMeterElement.labels   // WOL-Serverに未実装
    };
}
function createHTMLModElementJson(htmlModElement) {
    return {
        cite: htmlModElement.cite,
        datetime: htmlModElement.datetime
    };
}
function createHTMLOListElementJson(htmlOListElement) {
    return {
        reversed: htmlOListElement.reversed,
        start: htmlOListElement.start,
        type: htmlOListElement.type
    };
}
function createHTMLObjectElementJson(htmlObjectElement) {
    return {
        //contentDocument: htmlObjectElement.contentDocument,   // WOL-Serverに未実装
        //contentWindow: htmlObjectElement.contentWindow,   // WOL-Serverに未実装
        data: htmlObjectElement.data,
        //form: htmlObjectElement.form, // WOL-Serverに未実装
        //formSelector: getSelectorFromElement(htmlObjectElement.form).join(" > "), // WOL-Serverに未実装
        height: htmlObjectElement.height,
        name: htmlObjectElement.name,
        useMap: htmlObjectElement.useMap,
        validationMessage: htmlObjectElement.validationMessage,
        //validity: htmlObjectElement.validity, // WOL-Serverに未実装
        width: htmlObjectElement.width,
        willValidate: htmlObjectElement.willValidate
    };
}
function createHTMLOptGroupElementJson(htmlOptGroupElement) {
    return {
        disabled: htmlOptGroupElement.disabled,
        label: htmlOptGroupElement.label
    };
}
function createHTMLOptionElementJson(htmlOptionElement) {
    return {
        defaultSelected: htmlOptionElement.defaultSelected,
        disabled: htmlOptionElement.disabled,
        //form: htmlOptionElement.form, // WOL-Serverに未実装
        //formSelector: getSelectorFromElement(htmlOptionElement.form).join(" > "), // WOL-Serverに未実装
        index: htmlOptionElement.index,
        label: htmlOptionElement.label,
        selected: htmlOptionElement.selected,
        text: htmlOptionElement.text,
        value: htmlOptionElement.value
    };
}
function createHTMLOutputElementJson(htmlOutputElement) {
    return {
        defaultValue: htmlOutputElement.defaultValue,
        //form: htmlOutputElement.form, 
        //formSelector: getSelectorFromElement(htmlOutputElement.form).join(" > "), // WOL-Serverに未実装
        //htmlFor: htmlOutputElement.htmlFor,   // WOL-Serverに未実装
        //labels: htmlOutputElement.labels, // WOL-Serverに未実装
        name: htmlOutputElement.name,
        type: htmlOutputElement.type,
        validationMessage: htmlOutputElement.validationMessage,
        //validity: htmlOutputElement.validity, // WOL-Serverに未実装
        value: htmlOutputElement.value,
        willValidate: htmlOutputElement.willValidate
    };
}
function createHTMLParamElementJson(htmlParamElement) {
    return {
        name: htmlParamElement.name,
        value: htmlParamElement.value
    };
}
function createHTMLProgressElementJson(htmlProgressElement) {
    return {
        max: htmlProgressElement.max,
        position: htmlProgressElement.position,
        value: htmlProgressElement.value,
        //labels: htmlProgressElement.labels    // WOL-Serverに未実装
    };
}
function createHTMLQuoteElementJson(htmlQuoteElement) {
    return {
        cite: htmlQuoteElement.cite
    };
}
function createHTMLScriptElementJson(htmlScriptElement) {
    return {
        type: htmlScriptElement.type,
        src: htmlScriptElement.src,
        charset: htmlScriptElement.charset,
        async: htmlScriptElement.async,
        defer: htmlScriptElement.defer,
        crossOrigin: htmlScriptElement.crossOrigin,
        text: htmlScriptElement.text,
        noModule: htmlScriptElement.noModule
    };
}
function createHTMLSelectElementJson(htmlSelectElement) {
	//console.log(htmlSelectElement.selectedIndex);
    return {
        autofocus: htmlSelectElement.autofocus,
        disabled: htmlSelectElement.disabled,
        //form: htmlSelectElement.form, // WOL-Serverに未実装
        //formSelector: getSelectorFromElement(htmlSelectElement.form).join(" > "), // WOL-Serverに未実装
        //labels: htmlSelectElement.labels, // WOL-Serverに未実装
        length: htmlSelectElement.length,
        multiple: htmlSelectElement.multiple,
        name: htmlSelectElement.name,
        //options: htmlSelectElement.options,   // WOL-Serverに未実装
        required: htmlSelectElement.required,
        selectedIndex: htmlSelectElement.selectedIndex,
        //selectedOptions: htmlSelectElement.selectedOptions,   // WOL-Serverに未実装
        size: htmlSelectElement.size,
        type: htmlSelectElement.type,
        validationMessage: htmlSelectElement.validationMessage,
        //validity: htmlSelectElement.validity, // WOL-Serverに未実装
        value: htmlSelectElement.value,
        willValidate: htmlSelectElement.willValidate
    };
}
function createHTMLSlotElementJson(htmlslotelement) {
    return {
        name: htmlslotelement.name
    }
}
function createHTMLSourceElementJson(htmlSourceElement) {
    return {
        keySystem: htmlSourceElement.keySystem, //experimental
        media: htmlSourceElement.media,
        sizes: htmlSourceElement.sizes,
        src: htmlSourceElement.src,
        srcset: htmlSourceElement.srcset,
        type: htmlSourceElement.type
    };
}
function createHTMLStyleElementJson(htmlStyleElement) {
    return {
        media: htmlStyleElement.media,
        type: htmlStyleElement.type,
        disabled: htmlStyleElement.disabled,
        //sheet: htmlStyleElement.sheet // WOL-Serverに未実装
    };
}
function createHTMLTableCellElementJson(htmlTableCellElement) {
    return {
        abbr: htmlTableCellElement.abbr,
        cellIndex: htmlTableCellElement.cellIndex,
        colSpan: htmlTableCellElement.colSpan,
        //headers: htmlTableCellElement.headers,    // WOL-Serverに未実装
        rowSpan: htmlTableCellElement.rowSpan,
        scope: htmlTableCellElement.scope
    };
}
function createHTMLTableColElementJson(htmlTableColElement) {
    return {
        span: htmlTableColElement.span
    };
}
function createHTMLTableElementJson(htmlTableElement) {
    return {
        //caption: htmlTableElement.caption,    // WOL-Serverに未実装
        //tHead: htmlTableElement.tHead,    // WOL-Serverに未実装
        //tFoot: htmlTableElement.tFoot,    // WOL-Serverに未実装
        //rows: htmlTableElement.rows,  // WOL-Serverに未実装
        //tBodies: htmlTableElement.tBodies,    // WOL-Serverに未実装
    };
}
function createHTMLTableRowElementJson(htmlTableRowElement) {
    return {
        //cells: htmlTableRowElement.cells, // WOL-Serverに未実装
        rowIndex: htmlTableRowElement.rowIndex,
        sectionRowIndex: htmlTableRowElement.sectionRowIndex
    };
}
function createHTMLTableSectionElementJson(htmlTableSectionElement) {
    return {
        //rows: htmlTableSectionElement.rows    // WOL-Serverに未実装
    };
}
function createHTMLTemplateElementJson(htmlTemplateElement) {
    return {
        //content: htmlTemplateElement.content  // WOL-Serverに未実装
    };
}
function createHTMLTextAreaElementJson(htmlTextAreaElement) {
    return {
        //form: htmlTextAreaElement.form,   // WOL-Serverに未実装
        //formSelector: getSelectorFromElement(htmlTextAreaElement.form),   // WOL-Serverに未実装
        type: htmlTextAreaElement.type,
        value: htmlTextAreaElement.value,
        textLength: htmlTextAreaElement.textLength,
        defaultValue: htmlTextAreaElement.defaultValue,
        placeholder: htmlTextAreaElement.placeholder,
        rows: htmlTextAreaElement.rows,
        cols: htmlTextAreaElement.cols,
        autofocus: htmlTextAreaElement.autofocus,
        name: htmlTextAreaElement.name,
        disabled: htmlTextAreaElement.disabled,
        //labels: htmlTextAreaElement.labels,   // WOL-Serverに未実装
        maxLength: htmlTextAreaElement.maxLength,
        readOnly: htmlTextAreaElement.readOnly,
        required: htmlTextAreaElement.required,
        selectionStart: htmlTextAreaElement.selectionStart,
        selectionEnd: htmlTextAreaElement.selectionEnd,
        selectionDirection: htmlTextAreaElement.selectionDirection,
        //validity: htmlTextAreaElement.validity,   // WOL-Serverに未実装
        willValidate: htmlTextAreaElement.willValidate,
        validationMessage: htmlTextAreaElement.validationMessage,
        autocomplete: htmlTextAreaElement.autocomplete,
        autocapitalize: htmlTextAreaElement.autocapitalize, //experimental
        inputMode: htmlTextAreaElement.inputMode, //experimental
        wrap: htmlTextAreaElement.wrap
    };
}
function createHTMLTimeElementJson(htmlTimeElement) {
    return {
        dateTime: htmlTimeElement.dateTime
    };
}
function createHTMLTitleElementJson(htmlTitleElement) {
    return {
        text: htmlTitleElement.text
    };
}
function createHTMLTrackElementJson(htmlTrackElement) {
    return {
        kind: htmlTrackElement.kind,
        src: htmlTrackElement.src,
        srclang: htmlTrackElement.srclang,
        label: htmlTrackElement.label,
        m_default: htmlTrackElement.default,    //defaultは予約語のため，m_をつける
        readyState: htmlTrackElement.readyState,
        //track: htmlTrackElement.track // WOL-Serverに未実装
    };
}
function createHTMLVideoElementJson(htmlVideoElement) {
    return {
        //height: htmlVideoElement.height,  // WOL-Serverに未実装
        poster: htmlVideoElement.poster,
        videoHeight: htmlVideoElement.videoHeight,
        videoWidth: htmlVideoElement.videoWidth,
        width: htmlVideoElement.width
    };
}

// 要素からCSSセレクターを生成する関数
// 生成されたセレクターのリストを返す(例. ["html", "body", "div#container", "ul", "li:nth-child(1)"])
function getSelectorFromElement(element) {
    // 引数がElementでない場合，空の配列を返す
    if (!(element instanceof Element)) {
        return [];
    }

    const names = [];
    // 要素の親要素までたどりながらセレクターを生成
    while (element && element.nodeType === Node.ELEMENT_NODE && element.nodeName) {
        let name = element.nodeName.toLowerCase();  // タグ名を小文字に変換

        // IDがあればIDをセレクターに追加
        if (element.id) {
            name += "#" + element.id;
        } else {
            let sib = element;
            let nth = 0;
            // 同じ親要素内での位置を計算
            while (sib && sib.nodeType === Node.ELEMENT_NODE) {
                nth++;
                sib = sib.previousSibling;
            }
            name += ":nth-child(" + nth + ")";  // nth-childを追加
        }
        names.unshift(name);    // 親要素から順番にセレクターを追加
        element = element.parentNode;   // 親要素に移動
    }
    return names;   // セレクターリストを返す
}

// ループ参照を防止して、オブジェクトを安全に文字列化するカスタム関数
function customStringify(json) {
    let cache = []; // 参照の重複を追跡するための配列
    const jsonString = JSON.stringify(json, (key, value) => {
        // 値がオブジェクトであり、かつキャッシュ配列に存在する場合（ループ参照を防ぐ）
        if (value && cache && typeof value === "object") {//
            if (cache.indexOf(value) !== -1) {  // すでに処理済みのオブジェクトはスルー
                return; // 値を返さず、スルーして再帰的なループを防止
            }
            cache.push(value);  // 処理中のオブジェクトをキャッシュに追加
        }
        return value;  // 値をそのまま返す（オブジェクトでない場合やループ参照でない場合）
    });
    cache = null; // キャッシュをクリアして、ガーベジコレクションを促す
    return jsonString;  // 最終的にシリアライズされたJSON文字列を返す
}

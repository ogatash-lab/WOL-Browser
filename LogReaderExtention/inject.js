let oplorLogs = [];

//ログの構造を記録しておく
//var LogType;
var EventType, NodeType;

const operationLogRequest = new XMLHttpRequest();
function init(){
    //operationLogRequest.open("post", "https://160.252.130.85:443/HW", true);//本番用
	operationLogRequest.open("post", "http://localhost:8080/OpLoRServerPrototype-1.0-SNAPSHOT/HW", true);//開発環境を経由しない場合
    //operationLogRequest.open("post", "http://localhost:8080/OpLoRServerPrototype_war_exploded/HW", true);//開発環境を経由する場合
    operationLogRequest.setRequestHeader("Content-Type", "application/json; charset=ASCII");
    operationLogRequest.withCredentials=true;
    operationLogRequest.onreadystatechange = () => {
        if (operationLogRequest.readyState !== 4 || operationLogRequest.status !== 200) {
			//console.log("post failed");
            return;
        }
    };
    return true;
}

/*
operationLogRequest.open("post", "http://localhost:8080/HW", true);
operationLogRequest.setRequestHeader("Content-Type", "application/json");
operationLogRequest.onreadystatechange = () => {
    if (operationLogRequest.readyState !== 4 || operationLogRequest.status !== 200) {
        return;
    }
};
*/
function sendEventLog(event) {
    if(event.target !== event.currentTarget) {
        return;
    }
    const json = [];
    json.push(parseEvent(event));
    //LogType+='#';
    json.push(parseElement(event.target));
    oplorLogs.push(customStringify(json));
    //LogType+='@@';
    sendLog();
}
function getSelectorFromElement(element) {
    if (!(element instanceof Element)) {
        return [];
    }

    const names = [];
    while (element
    && element.nodeType === Node.ELEMENT_NODE
    && element.nodeName) {
        let name = element.nodeName.toLowerCase();
        if (element.id) {
            name += "#" + element.id;
        } else {
            let sib = element;
            let nth = 0;
            while (sib && sib.nodeType === Node.ELEMENT_NODE) {console.log('json:'+oplorLogs.toString());
                nth++;
                sib = sib.previousSibling;
            }
            name += ":nth-child(" + nth + ")";
        }
        names.unshift(name);
        element = element.parentNode;
    }
    return names;
}
function parseEvent(event) {
    let json = {};
    if (typeof Event === 'function'&&event instanceof Event) {
        //LogType+='[Event]';
        EventType='Event';
        json = Object.assign(json, createEventJson(event));
    }
    if (typeof UIEvent === 'function'&&event instanceof UIEvent) {
        //LogType+='[UIEvent]';
        EventType='UIEvent';
        json = Object.assign(json, createUIEventJson(event));
    }
    // experimental event type
    if (typeof FocusEvent === 'function'&&event instanceof FocusEvent) {
        //LogType+='[FocusEvent]';
        EventType='FocusEvent';
        json = Object.assign(json, createFocusEventJson(event));
    }
    if (typeof MouseEvent === 'function'&&event instanceof MouseEvent) {
        //LogType+='[MouseEvent]';
        EventType='MouseEvent';
        json = Object.assign(json, createMouseEventJson(event));
    }
    //Firefoxでは定義されていないかもしれない
    if (typeof TouchEvent === 'function'&&event instanceof TouchEvent) {
        //LogType+='[TouchEvent]';
        EventType='TouchEvent';
        json = Object.assign(json, createTouchEventJson(event));
    }
    if (typeof CompositionEvent === 'function'&&event instanceof CompositionEvent) {
        //LogType+='[CompositionEvent]';
        EventType='CompositionEvent';
        json = Object.assign(json, createCompositionEventJson(event));
    }
    if (typeof KeyboardEvent === 'function'&&event instanceof KeyboardEvent) {
        //LogType+='[KeyboardEvent]';
        EventType='KeyboardEvent';
        json = Object.assign(json, createKeyboardEventJson(event));
    }
    if (typeof WheelEvent === 'function'&&event instanceof WheelEvent) {
        //LogType+='[WheelEvent]';
        EventType='WheelEvent';
        json = Object.assign(json, createWheelEventJson(event));
    }
    if(typeof PointerEvent=='function'&&event instanceof PointerEvent){
        EventType='PointerEvent';
        json=Object.assign(json, createPointerEventJson(event));
    }
    //experimental
    if (typeof InputEvent === 'function'&&event instanceof InputEvent) {
        //LogType+='[InputEvent]';
        EventType='InputEvent';
        json = Object.assign(json, createInputEventJson(event));
    }
    if (event.type === "selectionchange") {
        //LogType+='[sectionchange]';
        EventType='selectionchange';slack
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
    return json;
}
function createEventJson(event) {
    return {
        bubbles: event.bubbles,
        cancelable: event.cancelable,
        composed: event.composed,
//        currentTarget: event.currentTarget,
        defaultPrevented: event.defaultPrevented,
        eventPhase: event.eventPhase,
//        target: event.target,
        timeStamp: event.timeStamp,
        type: event.type,
        isTrusted: event.isTrusted
    }
}
function createUIEventJson(uiEvent) {
    return {
        detail: uiEvent.detail,
        //view: uiEvent.view
    }
}
function createFocusEventJson(focusEvent) {
    return {
        //relatedTarget: focusEvent.relatedTarget
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
        offsetX: mouseEvent.offsetX, //experimental
        offsetY: mouseEvent.offsetY, //experimental
        pageX: mouseEvent.pageX, //experimental
        pageY: mouseEvent.pageY, //experimental
        //region: region,
        //relatedTarget: mouseEvent.relatedTarget,
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
        changedTouches: event.changedTouches,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        //targetTouches: event.targetTouches,
        //touches: event.touches
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
        locate: keyboardEvent.locate,
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
        //dataTransfer: event.dataTransfer,
        inputType: event.inputType,
        isComposing: event.isComposing
    };
}

function parseElement(element) {
    let json = {};
    if (typeof Node === 'function'&&element instanceof Node) {
        //LogType+='[Node]';
        NodeType='Node';
        json = Object.assign(json, createNodeJson(element));
    }
    if (typeof Document === 'function'&&element instanceof Document) {
        //LogType+='[Document]';
        NodeType='Document';
        json = Object.assign(json, createDocumentJson(element));
    }
    if (typeof Element === 'function'&&element instanceof Element) {
        //LogType+='[Element]';
        NodeType='Element';
        json = Object.assign(json, createElementJson(element));
    }
    if (typeof CharacterData === 'function'&&element instanceof CharacterData) {
        //LogType+='[CharacterData]';
        NodeType='CharacterData';
        json = Object.assign(json, createCharacterDataJson(element));
    }
    if (typeof Text === 'function'&&element instanceof Text) {
        //LogType+='[Text]';
        NodeType='Text';
        json = Object.assign(json, createTextJson(element));
    }
    if (typeof DocumentFragment === 'function'&&element instanceof DocumentFragment) {
        //LogType+='[DocumentFragment]';
        NodeType='DocumentFragment';
        json = Object.assign(json, createDocumentFragmentJson(element));
    }
    if (typeof DocumentType === 'function'&&element instanceof DocumentType) {
        //LogType+='[DocumentType]';
        NodeType='DocumentType';
        json = Object.assign(json, createDocumentTypeJson(element));
    }
    if (typeof HTMLElement === 'function'&&element instanceof HTMLElement) {
        //LogType+='[HTMLElement]';
        NodeType='HTMLElement';
        json = Object.assign(json, createHTMLElementJson(element));
    }
    if (typeof SVGElement === 'function'&&element instanceof SVGElement) {
        //LogType+='[SVGElement]';
        NodeType='SVGElement';
        json = Object.assign(json, createSVGElementJson(element));
    }
    if (typeof HTMLAbchorElement === 'function'&&element instanceof HTMLAnchorElement) {
        //LogType+='[HTMLAnchorElement]';
        NodeType='HTMLAnchorElement';
        json = Object.assign(json, createHTMLAnchorElementJson(element));
    }
    if (typeof HTMLAreaElement === 'function'&&element instanceof HTMLAreaElement) {
        //LogType+='[HTMLAreaElement]';
        NodeType='HTMLAreaElement';
        json = Object.assign(json, createHTMLAreaElementJson(element));
    }
    if (typeof HTMLBaseElement === 'function'&&element instanceof HTMLBaseElement) {
        //LogType+='[HTMLBaseElement]';
        NodeType='HTMLBaseElement';
        json = Object.assign(json, createHTMLBaseElementJson(element));
    }
    if (typeof HTMLButtonElement === 'function'&&element instanceof HTMLButtonElement) {
        //LogType+='[HTMLButtonElement]';
        NodeType='HTMLButtonElement';
        json = Object.assign(json, createHTMLButtonElementJson(element));
    }
    if (typeof HTMLCanvasElement === 'function'&&element instanceof HTMLCanvasElement) {
        //LogType+='[HTMLCanvasElement]';
        NodeType='HTMLCanvasElement';
        json = Object.assign(json, createHTMLCanvasElementJson(element));
    }
    if (typeof HTMLDataElement === 'function'&&element instanceof HTMLDataElement) {
        //LogType+='[HTMLDataElement]';
        NodeType='HTMLDataElement';
        json = Object.assign(json, createHTMLDataElementJson(element));
    }
    if (typeof HTMLDataListElement === 'function'&&element instanceof HTMLDataListElement) {
        //LogType+='[HTMLDataListElement]';
        NodeType='HTMLDataListElement';
        json = Object.assign(json, createHTMLDataListElementJson(element));
    }
    if (typeof HTMLDialogElement === 'function'&&element instanceof HTMLDialogElement) {
        //LogType+='[HTMLDialogElement]';
        NodeType='HTMLDialogElement';
        json = Object.assign(json, createHTMLDialogElementJson(element));
    }
    if (typeof HTMLEmbedElement === 'function'&&element instanceof HTMLEmbedElement) {
        //LogType+='[HTMLEmbedElement]';
        NodeType='HTMLEmbedElement';
        json = Object.assign(json, createHTMLEmbedElementJson(element));
    }
    if (typeof HTMLFieldSetElement === 'function'&&element instanceof HTMLFieldSetElement) {
        //LogType+='[HTMLFieldSetElement]';
        NodeType='HTMLFieldElement';
        json = Object.assign(json, createHTMLFieldSetElementJson(element));
    }
    if (typeof HTMLFormElement === 'function'&&element instanceof HTMLFormElement) {
        //LogType+='[HTMLFormElement]';
        NodeType='HTMLFormElement';
        json = Object.assign(json, createHTMLFormElementJson(element));
    }

    if (typeof HTMLIFrameElement === 'function'&&element instanceof HTMLIFrameElement) {
        json = Object.assign(json, createHTMLIFrameElementJson(element));
    }
    if (typeof HTMLInputElement === 'function'&&element instanceof HTMLInputElement) {
        //LogType+='[HTMLInputElement]';
        NodeType='HTMLInputElement';
        json = Object.assign(json, createHTMLInputElementJson(element));
    }

    if (typeof HTMLKeygenElement === 'function'&&element instanceof HTMLKeygenElement) {
        json = Object.assign(json, createHTMLKeygenElementJson(element));
    }
    if (typeof HTMLLIElement === 'function'&&element instanceof HTMLLIElement) {
        //LogType+='[HTMLLIElement]';
        NodeType='HTMLLIElement';
        json = Object.assign(json, createHTMLLIElementJson(element));
    }
    if (typeof HTMLLabelElement === 'function'&&element instanceof HTMLLabelElement) {
        //LogType+='[HTMLLabelElement]';
        NodeType='HTMLLabelElement';
        json = Object.assign(json, createHTMLLabelElementJson(element));
    }
    if (typeof HTMLLegendElement === 'function'&&element instanceof HTMLLegendElement) {
        //LogType+='[HTMLLegendElement]';
        NodeType='HTMLLegend';
        json = Object.assign(json, createHTMLLegendElementJson(element));
    }
    if (typeof HTMLLinkElement === 'function'&&element instanceof HTMLLinkElement) {
        //LogType+='[HTMLLinkElement]';
        NodeType='HTMLLinkElement';
        json = Object.assign(json, createHTMLLinkElementJson(element));
    }
    if (typeof HTMLMapElement === 'function'&&element instanceof HTMLMapElement) {
        //LogType+='[HTMLMapElement]';
        NodeType='HTMLMapElement';
        json = Object.assign(json, createHTMLMapElementJson(element));
    }
    if (typeof HTMLMediaElement === 'function'&&element instanceof HTMLMediaElement) {
        json = Object.assign(json, createHTMLMediaElementJson(element));
    }
    if (typeof HTMLMetaElement === 'function'&&element instanceof HTMLMetaElement) {
        //LogType+='[HTMLMetaElement]';
        NodeType='HTMLMetaElement';
        json = Object.assign(json, createHTMLMetaElementJson(element));
    }
    if (typeof HTMLMeterElement === 'function'&&element instanceof HTMLMeterElement) {
        //LogType+='[HTMLMeterElement]';
        NodeType='HTMLMeterElement';
        json = Object.assign(json, createHTMLMeterElementJson(element));
    }
    if (typeof HTMLModElement === 'function'&&element instanceof HTMLModElement) {
        //LogType+='[HTMLModElement]';
        NodeType='HTMLModElement';
        json = Object.assign(json, createHTMLModElementJson(element));
    }
    if (typeof HTMLOListElement === 'function'&&element instanceof HTMLOListElement) {
        //LogType+='[HTMLOListElement]';
        NodeType='HTMLOListElement';
        json = Object.assign(json, createHTMLOListElementJson(element));
    }
    if (typeof HTMLObjectElement === 'function'&&element instanceof HTMLObjectElement) {
        //LogType+='[HTMLObjectElement]';
        NodeType='HTMLPbjectElement';
        json = Object.assign(json, createHTMLObjectElementJson(element));
    }
    if (typeof HTMLOptGroupElement === 'function'&&element instanceof HTMLOptGroupElement) {
        //LogType+='[HTMLOptGroupElement]';
        NodeType='HTMLOptGroupElement';
        json = Object.assign(json, createHTMLOptGroupElementJson(element));
    }
    if (typeof HTMLOptionElement === 'function'&&element instanceof HTMLOptionElement) {
        //LogType+='[HTMLOptionElement]';
        NodeType='HTMLOptionElement';
        json = Object.assign(json, createHTMLOptionElementJson(element));
    }
    if (typeof HTMLOutputElement === 'function'&&element instanceof HTMLOutputElement) {
        //LogType+='[HTMLOutputElement]';
        NodeType='HTMLOutputElement';
        json = Object.assign(json, createHTMLOutputElementJson(element));
    }
    if (typeof HTMLParamElement === 'function'&&element instanceof HTMLParamElement) {
        //LogType+='[HTMLParamElement]';
        NodeType='HTMLParamElement';
        json = Object.assign(json, createHTMLParamElementJson(element));
    }
    if (typeof HTMLProgressElement === 'function'&&element instanceof HTMLProgressElement) {
        //LogType+='[HTMLProgressElement]';
        NodeType='HTMLProgressElement';
        json = Object.assign(json, createHTMLProgressElementJson(element));
    }
    if (typeof HTMLQuoteElement === 'function'&&element instanceof HTMLQuoteElement) {
        //LogType+='[HTMLQuoteElement]';
        NodeType='HTMLQuoteElement';
        json = Object.assign(json, createHTMLQuoteElementJson(element));
    }
    if (typeof HTMLScriptElement === 'function'&&element instanceof HTMLScriptElement) {
        //LogType+='[HTMLScriptElement]';
        NodeType='HTMLScriptElement';
        json = Object.assign(json, createHTMLScriptElementJson(element));
    }
    if (typeof HTMLSelectElement === 'function'&&element instanceof HTMLSelectElement) {
        //LogType+='[HTMLSelectElement]';
        NodeType='HTMLSelectElement';
        json = Object.assign(json, createHTMLSelectElementJson(element));
    }
    if (typeof HTMLSourceElement === 'function'&&element instanceof HTMLSourceElement) {
        //LogType+='[HTMLSourceElement]';
        NodeType='HTMLSourceElement';
        json = Object.assign(json, createHTMLSourceElementJson(element));
    }
    if (typeof HTMLStyleElement === 'function'&&element instanceof HTMLStyleElement) {
        //LogType+='[HTMLStyleElement]';
        NodeType='HTMLStyleElement';
        json = Object.assign(json, createHTMLStyleElementJson(element));
    }
    if (typeof HTMLTableCellElement === 'function'&&element instanceof HTMLTableCellElement) {
        //LogType+='[HTMLTableCellElement]';
        NodeType='HTMLTableCellElement';
        json = Object.assign(json, createHTMLTableCellElementJson(element));
    }
    if (typeof HTMLTableColElement === 'function'&&element instanceof HTMLTableColElement) {
        //LogType+='[HTMLTableColElement]';
        NodeType='HTMLTableColElement';
        json = Object.assign(json, createHTMLTableColElementJson(element));
    }
    if (typeof HTMLTableElement === 'function'&&element instanceof HTMLTableElement) {
        //LogType+='[HTMLTableElement]';
        NodeType='HTMLTableElement';
        json = Object.assign(json, createHTMLTableElementJson(element));
    }
    if (typeof HTMLTableHeaderCellElement === 'function'&&element instanceof HTMLTableHeaderCellElement) {
        json = Object.assign(json, createHTMLTableHeaderCellElementJson(element));
    }
    if (typeof HTMLTableRowElement === 'function'&&element instanceof HTMLTableRowElement) {
        //LogType+='[HTMLTableRowElement]';
        NodeType='HTMLTableRowElement';
        json = Object.assign(json, createHTMLTableRowElementJson(element));
    }
    if (typeof HTMLTableSectionElement === 'function'&&element instanceof HTMLTableSectionElement) {
        //LogType+='[HTMLTableSectionElement]';
        NodeType='HTMLTableSectionElement';
        json = Object.assign(json, createHTMLTableSectionElementJson(element));
    }
    if (typeof HTMLTemplateElement === 'function'&&element instanceof HTMLTemplateElement) {
        //LogType+='[HTMLTemplateElement]';
        NodeType='HTMLTemplateElement';
        json = Object.assign(json, createHTMLTemplateElementJson(element));
    }
    if (typeof HTMLTextAreaElement === 'function'&&element instanceof HTMLTextAreaElement) {
        //LogType+='[HTMLTextAreaElement]';
        NodeType='HTMLTextAreaElement';
        json = Object.assign(json, createHTMLTextAreaElementJson(element));
    }
    if (typeof HTMLTimeElement === 'function'&&element instanceof HTMLTimeElement) {
        //LogType+='[HTMLTimeElement]';
        NodeType='HTMLTimeElement';
        json = Object.assign(json, createHTMLTimeElementJson(element));
    }
    if (typeof HTMLTitleElement === 'function'&&element instanceof HTMLTitleElement) {
        //LogType+='[HTMLTitleElement]';
        NodeType='HTMLTitleElement';
        json = Object.assign(json, createHTMLTitleElementJson(element));
    }
    if (typeof HTMLTrackElement === 'function'&&element instanceof HTMLTrackElement) {
        //LogType+='[HTMLTrackElement]';
        NodeType='HTMLTrackElement';
        json = Object.assign(json, createHTMLTrackElementJson(element));
    }
    if (typeof HTMLVideoElement === 'function'&&element instanceof HTMLVideoElement) {
        //LogType+='[HTMLVideoElement]';
        NodeType='HTMLVideoElement';
        json = Object.assign(json, createHTMLVideoElementJson(element));
    }
    return json;
}
function createNodeJson(node) {
    return {
        baseURI: node.baseURI,
//        childNodes: node.childNodes,
//        firstChild: node.firstChild,
        innerText: node.innerText,
//        lastChild: node.lastChild,
//        nextSibling: node.nextSibling,
        nodeName: node.nodeName,
        nodeType: node.nodeType,
        nodeValue: node.nodeValue,
//        ownerDocument: node.ownerDocument,
//        parentNode: node.parentNode,
//        parentElement: node.parentElement,
//        previousSibling: node.previousSibling,
        //column too long
		textContent: node.textContent
    };
}
function createDocumentJson(document) {
    return {
        characterSet: document.characterSet,
        compatMode: document.compatMode, //experimental
        contentType: document.contentType, //experimental
        //doctype: document.doctype,//fromJsonできない原因
//        documentElement: document.documentElement,
        //documentURI: document.documentURI,//fromJsonできない原因
        hidden: document.hidden,
        implementation: document.implementation,
//        lastStyleSheetSet: document.lastStyleSheetSet,
//        pointerLockElement: document.pointerLockElement, //experimental
//        preferredStyleSheetSet: document.preferredStyleSheetSet,
//        scrollingElement: document.scrollingElement,
        selectedStyleSheetSet: document.selectedStyleSheetSet,
//        styleSheets: document.styleSheets,
        styleSheetSets: document.styleSheetSets,
        timeline: document.timeline,
        undoManger: document.undoManger, //experimental
        visibilityState: document.vifsibilityState,
//        children: document.children, //experimental
//        firstElementChild: document.firstElementChild, //experimental
//        lastElementChild: document.lastElementChild, //experimental
//        childElementCount: document.childElementCount, //experimental
//        activeElement: document.activeElement,
        //origin
        activeElementSelector: getSelectorFromElement(document.activeElement),
//        anchors: document.anchors,
//        body: document.body,
        cookie: document.cookie,
//        defaultView: document.defaultView,
        designMode: document.designMode,
        dir: document.dir,
        domain: document.domain,
//        embeds: document.embeds,
//        forms: document.forms,
//        head: document.head,
//        images: document.images,
        lastModified: document.lastModified,
//        links: document.links,
        //location: document.location,//fromJsonできない原因
        plugins: document.plugins,
        readyState: document.readyState,
        referrer: document.referrer,
//        scripts: document.scripts,
		//文字コード
        //title: document.title,
        URL: document.URL,
    };
}
function createElementJson(element) {
    return {
        selector: getSelectorFromElement(element).join(" > "),
        assignedSlot: element.assignedSlot, //experimental
        attributes: element.attributes,
        classList: element.classList,
        className: element.className,
        clientHeight: element.clientHeight, //experimental
        clientLeft: element.clientLeft, //experimental
        clientTop: element.clientTop, //experimental
        clientWidth: element.sclientWidth, //experimental
        computedName: element.computedName,
        computedRole: element.computedRole,
        id: element.id,
		//column too long
        innerHTML: element.innerHTML,
        localName: element.localName,
        namespaceURI: element.namespaceURI,
//        nextElementSibling: element.nextElementSibling,
		//column too long
        outerHTML: element.outerHTML, //experimental
        prefix: element.prefix,
//        previousElementSibling: element.previousElementSibling,
        scrollHeight: element.scrollHeight, //experimental
        scrollLeft: element.scrollLeft, //experimental
        scrollTop: element.scrollTop, //experimental
        scrollWidth: element.scrollWidth, //experimental
        shadowRoot: element.shadowRoot, //experimental
        slot: element.slot, //experimental
        tagName: element.tagName,
        undoManager: element.undoManager, //experimental
        undoScope: element.undoScope //experimental
    };
}
function createCharacterDataJson(characterData) {
    return {
        data: characterData.data,
        length: characterData.length,
//        nextElementSibling: characterData.nextElementSibling,
//        previousElementSibling: characterData.previousElementSibling
    };
}
function createTextJson(text) {
    return {
        wholeText: text.wholeText,
        assignedSlot: text.assignedSlot
    };
}
function createDocumentFragmentJson(documentFragment) {
    return {
//        children: documentFragment.children, //experimental
//        firstElementChild: documentFragment.firstElementChild, //experimental
//        lastElementChild: documentFragment.lastElementChild, //experimental
//        childElementCount: documentFragment.childElementCount //experimental
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
//        contextMenu: htmlElement.contextMenu,
        dataset: htmlElement.dataset,
        dir: htmlElement.dir,
        draggable: htmlElement.draggable,
        dropzone: htmlElement.dropzone,
        hidden: htmlElement.hidden,
        itemScope: htmlElement.itemScope, //experimental
        itemType: htmlElement.itemType, //experimental
        itemId: htmlElement.itemId, //experimental
        itemRef: htmlElement.itemRef, //experimental
        itemProp: htmlElement.itemProp, //experimental
        itemValue: htmlElement.itemValue, //experimental
        lang: htmlElement.lang,
        offsetHeight: htmlElement.offsetHeight, //experimental
        offsetLeft: htmlElement.offsetLeft, //experimental
        offsetParent: htmlElement.offsetParent, //experimental
        offsetTop: htmlElement.offsetTop, //experimental
        offsetWidth: htmlElement.offsetWidth, //experimental
        properties: htmlElement.properties, //experimental
        spellcheck: htmlElement.spellcheck,
        //style: htmlElement.style,//fromJsonできない原因
        //tabIndex: htmlElement.tabIndex,//fromJsonできない原因
        //文字コードの問題
		//title: htmlElement.title,
        translate: htmlElement.translate //experimental
    };
}
function createSVGElementJson(svgElement) {
    return {
        dataset: svgElement.dataset,
        id: svgElement.id,
        xmlbase: svgElement.xmlbase,
//        ownerSVGElement: svgElement.ownerSVGElement,
//        viewportElement: svgElement.viewportElement
    };
}
function createHTMLAnchorElementJson(htmlAnchorElement) {
    return {
        accessKey: htmlAnchorElement.accessKey,
        download: htmlAnchorElement.download, //experimental
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
        referrerPolicy: htmlAnchorElement.referrerPolicy, //experimental
        rel: htmlAnchorElement.rel,
        relList: htmlAnchorElement.relList,
        search: htmlAnchorElement.search,
        tabindex: htmlAnchorElement.tabindex,
        target: htmlAnchorElement.target,
        text: htmlAnchorElement.text,
        type: htmlAnchorElement.type,
        username: htmlAnchorElement.username
    };
}
function createHTMLAreaElementJson(htmlAreaElement) {
    return {
        accessKey: htmlAreaElement.accessKey,
        alt: htmlAreaElement.alt,
        coords: htmlAreaElement.coords,
        download: htmlAreaElement.download, //experimental
        hash: htmlAreaElement.hash,
        host: htmlAreaElement.host,
        hostname: htmlAreaElement.hostname,
        href: htmlAreaElement.href,
        hreflang: htmlAreaElement.hreflang,
        media: htmlAreaElement.media,
        password: htmlAreaElement.password,
        origin: htmlAreaElement.origin,
        pathname: htmlAreaElement.pathname,
        port: htmlAreaElement.port,
        protocol: htmlAreaElement.protocol,
        referrerPolicy: htmlAreaElement.referrerPolicy, //experimental
        rel: htmlAreaElement.rel,
        relList: htmlAreaElement.relList,
        search: htmlAreaElement.search,
        shape: htmlAreaElement.shape,
        tabindex: htmlAreaElement.tabindex,
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
        accessKey: htmlButtonElement.accessKey,
        autofocus: htmlButtonElement.autofocus,
        disabled: htmlButtonElement.disabled,
//        form: htmlButtonElement.form,
        //origin
        formSelector: getSelectorFromElement(htmlButtonElement.form).join(" > "),
        formAction: htmlButtonElement.formAction,
        formEnctype: htmlButtonElement.formEnctype,
        formMethod: htmlButtonElement.formMethod,
        formNoValidate: htmlButtonElement.formNoValidate,
        formTarget: htmlButtonElement.formTarget,
        labels: htmlButtonElement.labels,
        menu: htmlButtonElement.menu, //experimental
        name: htmlButtonElement.name,
        tabIndex: htmlButtonElement.tabIndex,
        type: htmlButtonElement.type,
        validationMessage: htmlButtonElement.validationMessage,
        validity: htmlButtonElement.validity,
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
        elements: htmlFieldSetElement.elements,
//        form: htmlFieldSetElement.form,
        //origin
        formSelector: getSelectorFromElement(htmlFieldSetElement.form).join(" > "),
        name: htmlFieldSetElement.name,
        type: htmlFieldSetElement.type,
        validationMessage: htmlFieldSetElement.validationMessage,
        validity: htmlFieldSetElement.validity,
        willValidate: htmlFieldSetElement.willValidate
    };
}
function createHTMLFormElementJson(htmlFormElement) {
    return {
//        elements: htmlFormElement.elements,
        length: htmlFormElement.length,
        name: htmlFormElement.name,
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
        allow: htmlIFrameElement.allow, //experimental
        allowfullscreen: htmlIFrameElement.allowfullscreen, //experimental
        allowPaymentRequest: htmlIFrameElement.allowPaymentRequest,
//        contentDocument: htmlIFrameElement.contentDocument,
//        contentWindow: htmlIFrameElement.contentWindow,
        height: htmlIFrameElement.height,
        name: htmlIFrameElement.name,
        referrerPolicy: htmlIFrameElement.referrerPolicy, //experimental
        sandbox: htmlIFrameElement.sandbox,
        src: htmlIFrameElement.src,
        srcdoc: htmlIFrameElement.srcdoc,
        width: htmlIFrameElement.width
    };
}
function createHTMLInputElementJson(htmlInputElement) {
   return {
        //parent form
//        form: htmlInputElement.form,
        //origin
        formSelector: getSelectorFromElement(htmlInputElement.form).join(" > "),
        formAction: htmlInputElement.formAction,
        formEncType: htmlInputElement.formEncType,
        formMethod: htmlInputElement.formMethod,
        formNoValidate: htmlInputElement.formNoValidate,
        formTarget: htmlInputElement.formTarget,
        //any type
        name: htmlInputElement.name,
        type: htmlInputElement.type,
        disabled: htmlInputElement.disabled,
        autofocus: htmlInputElement.autofocus,
        required: htmlInputElement.required,
        value: htmlInputElement.value,
        validity: htmlInputElement.validity,
        validationMessage: htmlInputElement.validationMessage,
        willValidate: htmlInputElement.willValidate,
        //checkbox / radio
        checked: htmlInputElement.checked,
        defaultChecked: htmlInputElement.defaultChecked,
        indeterminate: htmlInputElement.indeterminate,
        //image
        alt: htmlInputElement.alt,
        height: htmlInputElement.height,
        src: htmlInputElement.src,
        width: htmlInputElement.width,
        //file
        accept: htmlInputElement.accept,
        files: htmlInputElement.files,
        //text/number-containing / element
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
        //not yet categorized
        defaultValue: htmlInputElement.defaultValue,
        dirName: htmlInputElement.dirName,
        //accessKey: htmlInputElement.accessKey,//fromJsonできない原因
        //list: htmlInputElement.list,//fromJsonできない原因
        multiple: htmlInputElement.multiple,
        labels: htmlInputElement.labels,
        step: htmlInputElement.step,
        valueAsDate: htmlInputElement.valueAsDate,
        valueAsNumber: htmlInputElement.valueAsNumber,
        autocapitalize: htmlInputElement.autocapitalize //experimental
    };
}
function createHTMLKeygenElementJson(htmlKeygenElement) {
    return {
        autofocus: htmlKeygenElement.autofocus,
        challenge: htmlKeygenElement.challenge,
        disabled: htmlKeygenElement.disabled,
        form: htmlKeygenElement.form,
        keytype: htmlKeygenElement.keytype,
        labels: htmlKeygenElement.labels,
        name: htmlKeygenElement.name,
        type: htmlKeygenElement.type,
        validationMessage: htmlKeygenElement.validationMessage,
        validity: htmlKeygenElement.validity,
        willValidate: htmlKeygenElement.willValidate
    };
}
function createHTMLLIElementJson(htmlLiElement) {
    return {
        value: htmlLiElement.value
    };
}
function createHTMLLabelElementJson(htmlLabelElement) {
    return {
        accessKey: htmlLabelElement.accessKey,
        control: htmlLabelElement.control,
//        form: htmlLabelElement.form,
        //origin
        formSelector: getSelectorFromElement(htmlLabelElement.form).join(" > "),
        htmlFor: htmlLabelElement.htmlFor,
    };
}
function createHTMLLegendElementJson(htmlLegendElement) {
    return {
//        form: htmlLegendElement.form,
        //origin
        formSelector: getSelectorFromElement(htmlLegendElement.form).join(" > "),
        accessKey: htmlLegendElement.accessKey
    };
}
function createHTMLLinkElementJson(htmlLinkElement) {
    return {
        as: htmlLinkElement.as,
        crossOrigin: htmlLinkElement.crossOrigin, //experimental
        disabled: htmlLinkElement.disabled,
        href: htmlLinkElement.href,
        hreflang: htmlLinkElement.hreflang,
        media: htmlLinkElement.media,
        referrerPolicy: htmlLinkElement.referrerPolicy,
        rel: htmlLinkElement.rel,
        relList: htmlLinkElement.relList,
        sizes: htmlLinkElement.sizes,
        sheet: htmlLinkElement.sheet,
        type: htmlLinkElement.type
    };
}
function createHTMLMapElementJson(htmlMapElement) {
    return {
        name: htmlMapElement.name,
        areas: htmlMapElement.areas,
        images: htmlMapElement.images
    };
}
function createHTMLMediaElementJson(htmlMediaElement) {
    return {
        audioTracks: htmlMediaElement.audioTracks,
        autoplay: htmlMediaElement.autoplay,
        buffered: htmlMediaElement.buffered,
        controller: htmlMediaElement.controller,
        controls: htmlMediaElement.controls,
        controlsList: htmlMediaElement.controlsList,
        crossOrigin: htmlMediaElement.crossOrigin,
        currentSrc: htmlMediaElement.currentSrc,
        currentTime: htmlMediaElement.currentTime,
        defaultMuted: htmlMediaElement.defaultMuted,
        defaultPlaybackRate: htmlMediaElement.defaultPlaybackRate,
        disableRemotePlayback: htmlMediaElement.disableRemotePlayback,
        duration: htmlMediaElement.duration,
        ended: htmlMediaElement.ended,
        error: htmlMediaElement.error,
        loop: htmlMediaElement.loop,
        mediaGroup: htmlMediaElement.mediaGroup,
        mediaKeys: htmlMediaElement.mediaKeys, //experimental
        muted: htmlMediaElement.muted,
        networkState: htmlMediaElement.networkState,
        paused: htmlMediaElement.paused,
        playbackRate: htmlMediaElement.playbackRate,
        played: htmlMediaElement.played,
        preload: htmlMediaElement.preload,
        readyState: htmlMediaElement.readyState,
        seekable: htmlMediaElement.seekable,
        seeking: htmlMediaElement.seeking,
        sinkId: htmlMediaElement.sinkId,
        src: htmlMediaElement.src,
        srcObject: htmlMediaElement.srcObject,
        textTracks: htmlMediaElement.textTracks,
        videoTracks: htmlMediaElement.videoTracks,
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
        labels: htmlMeterElement.labels
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
//        contentDocument: htmlObjectElement.contentDocument,
//        contentWindow: htmlObjectElement.contentWindow,
        data: htmlObjectElement.data,
//        form: htmlObjectElement.form,
        //origin
        formSelector: getSelectorFromElement(htmlObjectElement.form).join(" > "),
        height: htmlObjectElement.height,
        name: htmlObjectElement.name,
        tabindex: htmlObjectElement.tabindex,
        typeMustMatch: htmlObjectElement.typeMustMatch,
        useMap: htmlObjectElement.useMap,
        validationMessage: htmlObjectElement.validationMessage,
        validity: htmlObjectElement.validity,
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
//        form: htmlOptionElement.form,
        //origin
        formSelector: getSelectorFromElement(htmlOptionElement.form).join(" > "),
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
        //origin
        formSelector: getSelectorFromElement(htmlOutputElement.form).join(" > "),
        htmlFor: htmlOutputElement.htmlFor,
        labels: htmlOutputElement.labels,
        name: htmlOutputElement.name,
        type: htmlOutputElement.type,
        validationMessage: htmlOutputElement.validationMessage,
        validity: htmlOutputElement.validity,
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
        labels: htmlProgressElement.labels
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
        crossOrigin: htmlScriptElement.crossOrigin, //experimental
        text: htmlScriptElement.text,
        noModule: htmlScriptElement.noModule
    };
}
function createHTMLSelectElementJson(htmlSelectElement) {
	//console.log(htmlSelectElement.selectedIndex);
    return {
        autofocus: htmlSelectElement.autofocus,
        disabled: htmlSelectElement.disabled,
        //form: htmlSelectElement.form,
        //origin
        formSelector: getSelectorFromElement(htmlSelectElement.form).join(" > "),
        labels: htmlSelectElement.labels,
        length: htmlSelectElement.length,
        multiple: htmlSelectElement.multiple,
        name: htmlSelectElement.name,
        options: htmlSelectElement.options,
        required: htmlSelectElement.required,
        selectedIndex: htmlSelectElement.selectedIndex,
        selectedOptions: htmlSelectElement.selectedOptions,
        size: htmlSelectElement.size,
        type: htmlSelectElement.type,
        validationMessage: htmlSelectElement.validationMessage,
        validity: htmlSelectElement.validity,
        value: htmlSelectElement.value,
        willValidate: htmlSelectElement.willValidate
    };
}
function createHTMLSourceElementJson(htmlSourceElement) {
    return {
        keySystem: htmlSourceElement.keySystem, //experimental
        media: htmlSourceElement.media,
        sizes: htmlSourceElement.sizes, //experimental
        src: htmlSourceElement.src,
        srcset: htmlSourceElement.srcset, //experimental
        type: htmlSourceElement.type
    };
}
function createHTMLStyleElementJson(htmlStyleElement) {
    return {
        media: htmlStyleElement.media,
        type: htmlStyleElement.type,
        disabled: htmlStyleElement.disabled,
        sheet: htmlStyleElement.sheet
    };
}
function createHTMLTableCellElementJson(htmlTableCellElement) {
    return {
        abbr: htmlTableCellElement.abbr,
        cellIndex: htmlTableCellElement.cellIndex,
        colSpan: htmlTableCellElement.colSpan,
        //headers: htmlTableCellElement.headers,
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
        caption: htmlTableElement.caption,
        //tHead: htmlTableElement.tHead,
        //tFoot: htmlTableElement.tFoot,
        //rows: htmlTableElement.rows,
        //tBodies: htmlTableElement.tBodies,
        sortable: htmlTableElement.sortable //experimental
    };
}
function createHTMLTableHeaderCellElementJson(htmlTableHeaderCellElement) {
    return {
        abbr: htmlTableHeaderCellElement.abbr,
        scope: htmlTableHeaderCellElement.scope,
        sorted: htmlTableHeaderCellElement.sorted //experimental
    };
}
function createHTMLTableRowElementJson(htmlTableRowElement) {
    return {
        //cells: htmlTableRowElement.cells,
        rowIndex: htmlTableRowElement.rowIndex,
        sectionRowIndex: htmlTableRowElement.sectionRowIndex
    };
}
function createHTMLTableSectionElementJson(htmlTableSectionElement) {
    return {
        //rows: htmlTableSectionElement.rows
    };
}
function createHTMLTemplateElementJson(htmlTemplateElement) {
    return {
        //content: htmlTemplateElement.content
    };
}
function createHTMLTextAreaElementJson(htmlTextAreaElement) {
    return {
        //form: htmlTextAreaElement.form,
        //origin
        formSelector: getSelectorFromElement(htmlTextAreaElement.form),
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
        labels: htmlTextAreaElement.labels,
        maxLength: htmlTextAreaElement.maxLength,
        accessKey: htmlTextAreaElement.accessKey,
        readOnly: htmlTextAreaElement.readOnly,
        required: htmlTextAreaElement.required,
        tabIndex: htmlTextAreaElement.tabIndex,
        selectionStart: htmlTextAreaElement.selectionStart,
        selectionEnd: htmlTextAreaElement.selectionEnd,
        selectionDirection: htmlTextAreaElement.selectionDirection,
        validity: htmlTextAreaElement.validity,
        willValidate: htmlTextAreaElement.willValidate,
        validationMessage: htmlTextAreaElement.validationMessage,
        autocomplete: htmlTextAreaElement.autocomplete, //experimental
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
        default: htmlTrackElement.default,
        readyState: htmlTrackElement.readyState,
        track: htmlTrackElement.track
    };
}
function createHTMLVideoElementJson(htmlVideoElement) {
    return {
        height: htmlVideoElement.height,
        poster: htmlVideoElement.poster,
        videoHeight: htmlVideoElement.videoHeight,
        videoWidth: htmlVideoElement.videoWidth,
        width: htmlVideoElement.width
    };
}

//タグでループするのを防ぐ
function customStringify(json) {
    let cache = [];
    const jsonString = JSON.stringify(json, (key, value) => {
        if (value && cache && typeof value === "object") {//
            if (cache.indexOf(value) !== -1) {//一階でも処理した所はスルー
                return;
            }
            cache.push(value);//してなければ処理済みにして
        }
        return value;//値を返す
    });
    cache = null; // Enable garbage collection
    return jsonString;
}

//astah

const eventSpecRequest = new XMLHttpRequest();
//eventSpecRequest.open("get", "https://160.252.130.85:443/standard_event.json", true);//本番用
//eventSpecRequest.open("get", "http://localhost:8080/OpLoRServerPrototype_war_exploded/standard_event.json", true);//経由する
eventSpecRequest.open("get", "http://localhost:8080/OpLoRServerPrototype-1.0-SNAPSHOT/standard_event.json", true)//経由しない

//eventSpecRequest.open("post", "http://localhost:8080/OpLoRServerPrototype/HW", true);
eventSpecRequest.onreadystatechange = () => {
    if (eventSpecRequest.readyState !== 4 || eventSpecRequest.status !== 200) {//正常に通信が終わらない
        return;
    }
    const eventSpecs = JSON.parse(eventSpecRequest.responseText);//JSON形式からオブジェクトに
    for (const eventSpec of eventSpecs) {//
		//eventの種類確認用
		//console.log(eventSpec.name);
        if (isTarget(eventSpec)) {//ログをとるイベントかどうか確認
            //console.log(eventSpec.name+"2");
			addEventListenerToAllEventTargets(document, eventSpec);//リスナーを登録
        }
    }
};
function isTarget(eventSpec) {
	return !eventSpec.deprecated//非推奨ではないもの
        && !eventSpec.experimental//実験的なものでないもの
        && !eventSpec.type.deprecated//非推奨でないもの
        && !eventSpec.type.experimental
        //&& eventSpec.specification.includes("DOM_L3")
        //デバックしずらいから否定になっている。
        //&& eventSpec.type.name != "MouseEvent"
		//MouseEventを細かく設定するとき用
		//&& eventSpec.name!="click"
		//&& eventSpec.name!="contextmenu"
		//&& eventSpec.name!="dbclick"
		//&& eventSpec.name!="mousedown"
		//&& eventSpec.name!="mouseenter"
		//&& eventSpec.name!="mouseleave"
		//&& eventSpec.name!="mousemove"
		//&& eventSpec.name!="mouseout"
		//&& eventSpec.name!="mouseup"
        //&& eventSpec.name!="show"
		//&& eventSpec.name!="mouseover"
		//MouseEventここまで
		//&& eventSpec.type.name != "WheelEvent"
		&& eventSpec.type.name != "PointerEvent"
        ;
}

function addEventListenerToAllEventTargets(candidate, eventSpec) {
    	//console.log(eventSpec.name+":"+candidate.tagName);
	if (!(candidate instanceof EventTarget) || !eventSpec) {
        return;
    }
    candidate.addEventListener(eventSpec.name, sendEventLog, false);//ここのfalseの意味を調べてくる。(バブリングフェイズ)
    //処理効率によっては変更
    if (candidate instanceof Node) {
        for (const child of candidate.childNodes) {
            //子ノードに対しても同じ処理を再帰的にしていく。
            addEventListenerToAllEventTargets(child, eventSpec);
        }
    }
}

const config = {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true
};
const observer = new MutationObserver(sendMutationLog);
//observer.observe(document, config);//動的にサイトが変更したログも表示される。量が多い。
//observer.disconnect();

function sendMutationLog(mutations) {
    oplorLogs.push(customStringify(parseMutations(mutations)));
    sendLog();
}
function parseMutations(mutations) {
    const mutationArray = [];
    mutations.forEach((mutation) => {
        const json = [];
        json.push({
            type: mutation.type,
//            target: mutation.target,
            addedNodes: mutation.addedNodes,
            removedNodes: mutation.removedNodes,
//            previousSibling: mutation.previousSibling,
//            nextSibling: mutation.nextSibling,
            attributeName: mutation.attributeName,
            attributeNamespace: mutation.attributeNamespace
        });
        json.push(parseElement(mutation.target));
        mutationArray.push(json);
    });
    return mutationArray;
}

var Logs=new Array();

function sendLog() {
    if (oplorLogs.length > 0){
		if(init()) {
			console.log("Logs:"+oplorLogs.toString());
            operationLogRequest.send(EventType+"@@"+NodeType+"@@"+ oplorLogs.toString());
        }
        oplorLogs = [];
    }
}

function createDate(){
	var now=new Date();
	var year = now.getFullYear();
	var month = now.getMonth()+1;
	var week = now.getDay();
	var day = now.getDate();
	var hours = now.getHours();
	var minutes = now.getMinutes();
	var seconds = now.getSeconds();
	var milliseconds = now.getMilliseconds();
	return "西暦"+year+"年"+month+"月"+day+"日"+hours+"時"+minutes+"分"+seconds+"."+milliseconds+"秒"
}

eventSpecRequest.send(null);
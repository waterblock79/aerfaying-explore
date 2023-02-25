// ==UserScript==
// @name         Aerfaying Explore - 阿儿法营/稽木世界社区优化插件
// @namespace    waterblock79.github.io
// @version      1.12.0
// @description  提供优化、补丁及小功能提升社区内的探索效率和用户体验
// @author       waterblock79
// @match        http://gitblock.cn/*
// @match        https://gitblock.cn/*
// @match        http://aerfaying.com/*
// @match        https://aerfaying.com/*
// @icon         https://gitblock.cn/Content/logo.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==
/*
   aerfaying-explore 是一个非官方的、针对阿儿法营/稽木世界社区的开源优化插件
   https://github.com/waterblock79/aerfaying-explore
*/

(function () {
    'use strict';
    // 初始化信息
    try {
        var window = unsafeWindow || window;
    } catch (e) { }
    if (!window) {
        try {
            var window = self;
        } catch (e) {
            alert('似乎无法在您的浏览器上运行此脚本。')
        }
    }
    const version = '1.12.0';

    if (location.search === '?NoUserscript') return;

    // 判断 GM_setValue、GM_getValue 是否可用（貌似不存在的话，获取就报错，不能像 foo == undefined 那样获取它是否存在）
    try {
        if (GM_getValue && GM_setValue) {
            window.GMAvailable = true;
        } else {
            window.GMAvailable = false;
        }
    } catch (e) {
        window.GMAvailable = false;
    }

    //  $(selector)
    //  即 document.querySelectorAll(selector)
    const $ = (selector) => document.querySelectorAll(selector);


    //  addSelectorEvent(selector, event, callback)
    //  为全部符合 selector 选择器的元素自动添加 event 事件，若该事件被触发就会执行 callback 回调
    let eventElement = [];
    const addSelectorEvent = (selector, event, callback) => {
        if (Array.isArray(event)) {
            for (let i in event) {
                addSelectorEvent(selector, event[i], callback);
            }
            return;
        }
        eventElement.push({
            selector: selector,
            event: event,
            callback: callback,
            handledElements: []
        })
    }
    window.addSelectorEvent = addSelectorEvent;


    //  addFindElement(selector, callback)
    //  当选择器发现新的符合 selector 的元素就执行 callback，callback 会传入该元素。
    let findElement = [];
    const addFindElement = (selector, callback) => {
        findElement.push({
            selector: selector,
            callback: callback,
            handledElements: []
        })
        // 此处返回该任务在 findElement 中的 index，方便后续删除该任务。
        return findElement.length - 1;
    };
    window.addFindElement = addFindElement;

    // addHrefChangeEvent(callback) 
    // 当页面 location.href 改变触发该事件
    let lastHref = null;
    let hrefChangeEvent = [];
    const addHrefChangeEvent = (callback) => {
        hrefChangeEvent.push({
            callback: callback,
        });
    };

    //  →_→
    //  通过 setInterval 实现 addFindElement 和 addSelectorEvent。
    setInterval(() => {
        // addFindElement
        findElement.forEach((item) => {
            $(item.selector).forEach((element) => {
                if (!item.handledElements.find(e => e == element)) {
                    item.handledElements.push(element);
                    (async () => { item.callback(element) })();
                }
            })
        })
        // addSelectorEvent
        eventElement.forEach((item) => {
            $(item.selector).forEach((element) => {
                if (!item.handledElements.find(e => e == element)) {
                    element.addEventListener(item.event, item.callback);
                    item.handledElements.push(element);
                }
            })
        });
        // addHrefChangeEvent
        if (lastHref != location.href) {
            hrefChangeEvent.forEach((item) => {
                (async () => { item.callback(location.href) })();
            });
        }
        lastHref = location.href;
    }, 16);


    //  addStyle(css)
    //  将 CSS 塞到 <style> 标签里然后添加到页面中
    const addStyle = (css) => {
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    };


    //  insertBefore(newElement, targetElement)
    //  把 newElement 插入到 targetElement 前面
    const insertBefore = (newElement, targetElement) => {
        targetElement.parentNode.insertBefore(newElement, targetElement);
    };

    // encodeHTML(str)
    // 转义字符串中的 HTML 字符
    const encodeHTML = (str) => {
        let textNode = document.createTextNode(str);
        let div = document.createElement('div');
        div.append(textNode);
        return div.innerHTML;
    };


    // 监听请求（这里用的是 jQuery 的 $）
    window.$(document).ajaxSuccess(function (event, xhr, settings, response) {
        if (settings.url.search(/WebApi\/Projects\/[0-9]+\/Get/) == 1) { // /WebApi/Projects/*/Get 获取作品信息
            projectThumbId = response.project.thumbId; // 在变量里保存获取到的作品封面
        }
        if (settings.url == '/WebApi/Comment/GetPage') { // /WebApi/Comment/GetPage 评论
            response.replies.forEach((comment) => {
                commentData[comment.id] = comment;
            });
            response.pagedThreads.items.forEach((comment) => {
                commentData[comment.id] = comment;
            });
        }
        if (settings.url == '/WebApi/Comment/Post') { // 匹配用户发送评论 /WebApi/Comment/Post
            commentData[response.comment.id] = response.comment;
        }
    });

    //  自动 HTTPS
    if (localStorage['explore:https'] == 'true') {
        if (location.toString().startsWith("http://")) {
            location = location.toString().replace("http://", "https://", 1);
        }
    }

    //  替换原不可用的 asset.mozhua.org:444 的资源地址
    addFindElement('img[src*="asset.mozhua.org:444"]', (element) => {
        element.src = element.src.replace('https://asset.mozhua.org:444/Media?name=', 'https://cdn.gitblock.cn/Media?name=');
    });


    //  添加控制台的提示
    if (window.top == window.self) {
        console.log(
            `%cAerfaying-Explore %c\n当前版本：${version}\n本插件开源于 Github:\nhttps://github.com/waterblock79/aerfaying-explore/`,
            'font-size: 1.5em; color: dodgerblue;',
            'font-size: 1em; color: black;'
        );
    }


    //  插件设置
    let settings = [{
        tag: 'explore:loading',
        text: '加载中所显示的提示设置',
        select: [
            '保持原状',
            '在导航栏显示“加载中”的文字和动画（最小）',
            '在左下角显示不影响浏览的加载中动画（经典）'
        ],
        type: 'radio',
        default: 1,
        desp: `
            <a target="_blank" href="/AboutLoading">如何选择？</a>
        `
    }, {
        tag: 'explore:https',
        text: '自动 HTTPS',
        type: 'check',
        default: true,
    }, {
        tag: 'explore:hoverId',
        text: '仅当鼠标悬停在评论上时显示评论 ID',
        type: 'check',
        default: false,
    }, {
        tag: 'explore:noMaxHeight',
        text: '禁用个人简介的最大高度限制',
        type: 'check',
        default: true,
    }, {
        tag: 'explore:lessRecommendProject',
        text: '单行显示推荐的精华作品',
        type: 'check',
        default: false,
    }, {
        tag: 'explore:copyLink',
        text: '鼠标悬停页面右下角时显示复制页面 Markdown 链接的按钮',
        type: 'check',
        default: false,
        disabled: !navigator.clipboard
    }, {
        tag: 'explore:tiebaEmoji',
        text: '在评论时添加贴吧表情',
        type: 'check',
        default: false,
    }, {
        tag: 'explore:fullscreenDisableScroll',
        text: '作品全屏时禁用鼠标滚轮滚动',
        type: 'check',
        default: true
    }, {
        tag: 'explore:previewReply',
        text: '在消息页面预览回复的内容',
        type: 'check',
        default: false,
        desp: '实验性功能，请谨慎使用'
    }, {
        tag: 'explore:previewCommentMarkdown',
        text: '在发表评论时预览评论 Markdown',
        type: 'check',
        default: false,
    }, {
        tag: 'explore:localSearch',
        text: '快速搜索',
        type: 'check',
        default: true,
        desp: `存储 ${localStorage['explore:searchDb'] ? JSON.parse(localStorage['explore:searchDb']).length : 0} 条数据，共 ${localStorage['explore:searchDb'] ? (localStorage['explore:searchDb'].length / 1024).toFixed(2) : 0} KB，<a href="/AboutLocalSearch" target="_blank">详细</a>`
    }, {
        tag: 'explore:betterPriseAndBlame',
        text: '优化评论赞踩显示机制',
        type: 'check',
        default: false,
        desp: `在评论下方只显示点赞数减去点踩数的值，并且这个值小于等于 0 时不显示，类似 B 站评论，可以对“点踩侠”眼不见心不烦`
    }
    ];
    // 设置默认值
    settings.forEach((item) => {
        if (!localStorage[item.tag]) {
            localStorage[item.tag] = item.default;
        }
    })
    // 创建设置摁钮
    let settingsButton = document.createElement('li');
    settingsButton.innerHTML = '<a id="nav-explore-setting"><span>插件设置</span></a>';
    addStyle(`
        .explore-settings-label {
            display: inline-table;
            font-size: 14px;
            font-weight: unset;
            line-height: unset;
            margin-bottom: 0px !important;
            color: #575e75;
            user-select: none;
        }
    `)
    settingsButton.addEventListener('click', () => {
        let html = '';
        // 设置项标题
        html += `
            <b style="margin: 0 .3em">
                设置
            </b>
        `
        // 每项的设置
        settings.forEach((item) => {
            if (item.show == false) {
                return;
            }
            html += `
                <div style="
                    margin: .6em .5em;
                    display: flex;
                    justify-content: space-between;
                ">
            `;
            // 设置名称，如果是 check 类型的设置项，就用 span 包裹，否则就用 b 包裹
            html += `
                        <label 
                            class="explore-settings-label" 
                            for="${item.tag}"
                        >
                            <span>${item.text}</span>
                            ${item.desp ? `
                                <br/>
                                <small>${item.desp}</small>
                            ` : ''}
                        </label>
                    `;
            // Check 类型设置项的勾选控件
            if (item.type == 'check') {
                html += `
                    <input
                        type="checkbox"
                        name="${item.tag}"
                        id="${item.tag}"
                        ${localStorage[item.tag] == 'true' ? 'checked' : ''}
                        onchange="localStorage['${item.tag}'] = this.checked"
                        style="margin-left: 0.8em; margin-left: 0.05em;"
                        ${item.disabled ? 'disabled' : ''}
                    />
                `;
            }
            // Radio 类型设置项的设置选项
            if (item.type == 'radio') {
                // 设置选项
                html += `<div style="margin-left: 0.8em;">`;
                item.select.forEach((selectItem, index) => {
                    html += `
                        <input
                            type="radio"
                            name="${item.tag}"
                            value="${index}"
                            id="${item.tag}-${index}"
                            ${index == localStorage[item.tag] ? 'checked' : ''}
                            onchange="localStorage['${item.tag}'] = ${index}"
                        />
                        <label
                            class="explore-settings-label"
                            style="display: inline;"
                            for="${item.tag}-${index}"
                        >
                            ${selectItem}
                        </label>
                        <br/>
                    `;
                });
                html += `</div>`;
            }
            html += '</div>';
        });
        // 自动跳转设置
        html += `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 1em 0;
            ">
                <div style="margin: 0.3em 0">
                    <b style="display: block">自动跳转</b>
                    <small>${window.GMAvailable ? '若不理解该选项的用途，请勿修改' : '似乎不支持该功能？'}</small>
                </div>
                <select 
                    style="height: 2em"
                    id="explore-redirect-selector"
                    onchange="SetRedirect(document.querySelector('#explore-redirect-selector').value)"
                    ${window.GMAvailable ? '' : 'disabled'}
                >
                    <option value="none">不自动跳转</option>
                    <option value="aerfaying">自动跳转 aerfaying.com</option>
                    <option value="gitblock">自动跳转 gitblock.cn</option>
                    <option value="3eworld">自动跳转 3eworld.cn</option>
                </select>
            </div>
        `;
        // 设置的尾部显示开源地址、版本
        html += `<hr/>`;
        html += `
            <div style="text-align:center">
                <a href="https://waterblock79.github.io/aerfaying-explore/" style="font-weight:600">插件官方页面</a>
                |
                <a href="https://github.com/waterblock79/aerfaying-explore" style="font-weight:600">开源仓库</a>
            </div>`;
        html += `<span style="display:block;text-align:center;margin-top:0.2em;font-size:85%;"> 插件版本 ${version} </span>`;
        html += `<br/>`;
        // 显示提示框
        Blockey.Utils.confirm('插件设置', html);
        // 移除掉“确定”按钮左边的“取消”按钮，并把“确定”摁钮中的文字替换为“关闭”
        $('button.ok-button')[0].parentNode.childNodes[0].remove();
        $('button.ok-button')[0].innerHTML = '关闭';
        $('button.ok-button')[0].addEventListener('click', () => { location.reload(); });
    });
    // 设置自动跳转选项的初始值
    addFindElement('select#explore-redirect-selector', (element) => {
        if (!window.GMAvailable) {
            element.value = 'none';
            return;
        }
        element.value = GM_getValue('explore:autoRedirect') || 'none';
    })
    // 插入设置按钮
    if (location.pathname.match(/\S+\/Editor/) == null && $('#nav-settings').length > 0) {// 当前页面不是作品编辑器页面时，并且已经登陆（#nav-settings 存在）
        insertBefore(settingsButton, $('#nav-settings')[0]);
    } else { // 如果现在没有插入这个元素，那就静待良机，等这个条件成立了以后再插入元素
        let waitInsertSettingsButtonInterval = setInterval(() => {
            if ($('#nav-settings').length > 0 && location.pathname.match(/\S+\/Editor/) == null) {
                insertBefore(settingsButton, $('#nav-settings')[0]);
                clearInterval(waitInsertSettingsButtonInterval);
            }
        }, 1000)
    }

    // 对于加载提示的介绍
    if (location.pathname == '/AboutLoading') {
        $('title')[0].innerHTML = `关于加载中的提示 - Aerfaying Explore`;
        $('.container')[1].innerHTML = `
            <img class="explore-about-loading" src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/%E5%8A%A0%E8%BD%BD%E6%8F%90%E7%A4%BA.svg">
        `;
        $('.container')[1].classList.add('content-container');
        addStyle(`
            .content-container {
                text-align: center;
            }
            .explore-about-loading {
                max-width: 85%;
                max-height: 30em;
                background: white;
                padding: 1em;
                border-radius: 12px;
                margin: 0.5em 0 2em 0;
                box-shadow: 2px 2px 15px rgb(0 0 0 / 5%);
            }
        `)
    }

    // 使弹出框（如评论详细信息、原创声明）中的内容可以被复制
    addStyle(`
    .modal_modal-content_3brCX {
        -webkit-user-select: auto !important;
        -moz-user-select: auto !important;
        -ms-user-select: auto !important;
        user-select: auto !important;
    }
    .item-attached-thin-modal-body_wrapper_3KdPz { user-select: none; }
    `);


    // 不文明用语“警告！！！”的不再提示
    addFindElement('div.modal_header-item_1WbOm.modal_header-item-title_1N2BE', (element) => {
        // 如果这个弹出框的标题是“警告！！！”
        if (element.innerHTML == '警告！！！') {
            // 如果已经标记不再提示了那就直接帮忙点一下确定键就好了
            if (sessionStorage.blockedAlert) {
                $('.footer>.ok-button')[0].click();
                return;
            }
            // 给真的确定摁钮加一个标记
            $('.footer>.ok-button')[0].classList.add("real");
            // 创建“不再提示”按钮
            let blockAlert = document.createElement('button');
            blockAlert.classList.add("ok-button");
            blockAlert.style.background = "coral";
            blockAlert.innerHTML = '不再提示';
            blockAlert.addEventListener('click', () => {
                $('.footer>.ok-button.real')[0].click(); // 点击真·确定按钮
                sessionStorage.blockedAlert = true;
            })
            // 插入摁钮
            insertBefore(blockAlert, $('.footer>.ok-button')[0]);
            $('.footer')[0].style.marginTop = '0.5em';
        }
    });


    // 替换掉原先全屏的加载遮盖
    let projectThumbId = 'E0D08BE45041CB909364CE99790E7249.png'; // 在加载作品时候需要用到的作品封面 assets ID
    addFindElement('.menu-bar_right-bar_3dIRQ', (element) => {
        // 如果其设置为“保持原状”，那就直接退出
        if (localStorage['explore:loading'] == 0) return;
        // 先隐藏了原先的加载遮盖
        addStyle(`
            .loader_background_1-Rwn { display: none !important }
        `);
        // 方案 1：在顶部导航栏中显示“加载中”图标及文字
        if (localStorage['explore:loading'] == 1) {
            // 创建并插入“加载中”文字
            let text = document.createElement('span');
            text.classList.add('explore-loading-text');
            text.innerText = '加载中';
            element.insertBefore(text, element.firstChild);
            // 创建并插入加载动画
            let loading = document.createElement('div');
            loading.classList.add('explore-loading');
            element.insertBefore(loading, element.firstChild);
            // CSS
            addStyle(`
            /* 加载动画和加载文字的 CSS */
            .explore-loading {
                border: 2.5px solid #f3f3f3b0;
                border-top: 2.5px solid #fff;
                border-radius: 100%;
                min-width: 1em;
                min-height: 1em;
                display: inline-block;
                animation: spin 2s linear infinite;
                margin: 0 0.3em;
            }
            .explore-loading-text {
                margin: 0 1.25em 0 0;
                min-width: 2em;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            /* 顶部通知图标稍微有一点歪，和这个加载提示在一起有点难看，要修正下 */
            i.notification {
                margin-bottom: 3px;
            }
            /* 若屏幕过窄就不显示加载文字 */
            @media screen and (max-width: 380px) {
                .explore-loading-text {
                    display: none !important;
                    width: 0 !important;
                }
            }
            `);
            // 默认隐藏
            $('.explore-loading')[0].style.display = 'none';
            try { $('.explore-loading-text')[0].style.display = 'none'; } catch (e) { }
        }
        // 方案 2：在左下角显示不影响浏览的加载提示（原方案）
        else {
            // 添加左下角加载提示
            let loadingElement = document.createElement('div');
            loadingElement.style = "width: 5em; height: 5em; position: fixed; background-color: #4c97ff; right: 5%; opacity: 0.8; bottom: 5%; border-radius: 8px;";
            loadingElement.classList.add("explore-loading");
            loadingElement.innerHTML = '<div class="loader_block-animation_2EgCQ" style="height: 3em;margin: 1em 1em 1em 1.25em;"><img class="loader_top-block_1-yuR" src="https://cdn.gitblock.cn/static/images/209cd016f099f4515cf80dff81e6e0f7.svg" style="margin: 0;"><img class="loader_middle-block_2ma0T" src="https://cdn.gitblock.cn/static/images/ab844ae9647bd855ed2f15b22c6b9337.svg" style="margin: 0;"><img class="loader_bottom-block_ABwSu" src="https://cdn.gitblock.cn/static/images/ee4f8261355c8d3b6fd7228a386c62be.svg" style="margin: 0;"></div>';
            document.body.appendChild(loadingElement)
            $('.explore-loading')[0].style.display = 'none';
        }
        // 如果发现了原先的加载遮盖，就显示新的加载提示
        addFindElement('.loader_background_1-Rwn', (element) => {
            $('.explore-loading')[0].style.display = 'block';
            try { $('.explore-loading-text')[0].style.display = 'block'; } catch (e) { }
            // 轮询直到原先的加载遮盖消失
            let interval = setInterval(() => {
                if (!$('.loader_background_1-Rwn')[0]) {
                    $('.explore-loading')[0].style.display = 'none';
                    try { $('.explore-loading-text')[0].style.display = 'none'; } catch (e) { }
                    // 作品加载完了就得删掉作品的加载动画了，并且恢复作品的大绿旗摁钮、恢复鼠标事件、删除作品封面背景
                    if ($('.explore-project-loading')[0]) {
                        // 删掉加载动画
                        $('.explore-project-loading')[0].remove();
                        // 恢复大绿旗摁钮
                        $('.stage_green-flag-overlay_219KT')[0].style.display = 'flex';
                        // 恢复鼠标事件
                        $('.controls_controls-container_3ZRI_')[0].style = '';
                        $('.stage_green-flag-overlay-wrapper_3bCO-')[0].style = '';
                        // 删除作品封面背景
                        try { $('.explore-project-cover')[0].remove(); } catch (e) { }
                        clearInterval(interval);
                    }
                }
            }, 50);
        });
        // 如果还发现了只有作品加载的时候会出现的“加载消息”，那就得给作品也加上一个加载的小动画+提示
        addFindElement('div.loader_message-container-outer_oYjTv', (element) => {
            // 如果现在是在编辑器页面，那就不用添加这个小动画和提示了
            if (location.pathname.match(/\S+\/Editor/) != null) return;
            // 创建加载的小动画和提示
            let projectLoad = document.createElement('div');
            projectLoad.classList.add('explore-project-loading');
            projectLoad.innerHTML = `
                <div class="loader_block-animation_2EgCQ">
                    <img class="loader_top-block_1-yuR" src="https://cdn.gitblock.cn/static/gui/static/assets/bbbd98ae6a34eac772e34a57aaa5f977.svg">
                    <img class="loader_middle-block_2ma0T" src="https://cdn.gitblock.cn/static/gui/static/assets/f9dce53613d5f85b311ce9f84423c08b.svg">
                    <img class="loader_bottom-block_ABwSu" src="https://cdn.gitblock.cn/static/gui/static/assets/ce5820b006d753e4133f46ae776f4d96.svg">
                </div>
                <div class="loader_title_28GDz" style="
                    color: white;
                ">
                    <span>载入项目</span
                ></div>
            `;
            $('div.stage_green-flag-overlay-wrapper_3bCO-.box_box_tWy-0')[0].appendChild(projectLoad);
            // 隐藏作品的大绿旗摁钮
            $('.stage_green-flag-overlay_219KT')[0].style.display = 'none';
            // 禁止鼠标事件（别加载着一半就点绿旗开始运行了）
            $('.controls_controls-container_3ZRI_')[0].style = 'pointer-events: none;';
            $('.stage_green-flag-overlay-wrapper_3bCO-')[0].style = 'pointer-events: none;';
            // 用这个“...canvas-wrapper-mobile_2WJLy”是否存在判断是否为手机端布局，不是手机端布局就加上作品封面背景
            let projectImage = document.createElement('img');
            projectImage.src = `https://cdn.gitblock.cn/Media?name=${projectThumbId}`;
            projectImage.classList.add('explore-project-cover');
            addStyle(`
                .explore-project-cover {
                    position: absolute;
                    top: 0;
                    width: 100%;
                    filter: blur(6px);
                    overflow: hidden;
                    transform: scale(1.05);
                }
                /* 因为这个封面有模糊效果，它可能会超出边界，所以要给最外层的这个设置一个 overflow: hidden;，
                    再设置一个 border-radius: 0.5rem; 修一下边 */
                div.stage-wrapper_stage-canvas-wrapper_n2Q5r.box_box_tWy-0 {
                    border-radius: 0.5rem;
                    overflow: hidden;
                }
                div.stage-wrapper_stage-canvas-wrapper-mobile_2WJLy.box_box_tWy-0 {
                    border-radius: 0.5rem;
                    overflow: hidden;
                }
            `);
            insertBefore(projectImage, $('div.stage_green-flag-overlay-wrapper_3bCO-.box_box_tWy-0')[0]);
        });
    })

    // 让手机端布局的用户主页也能显示用户 ID、金币、比特石
    addStyle(`
        @media (max-width: 768px) {
            .profile-head_bitStones_1GFkj, .profile-head_goldCoins_TxdJM {
                display: inline-flex !important;
            }
        }
    `);

    // 在用户主页显示被邀请的信息、显示邀请的用户的入口
    addHrefChangeEvent((url) => {
        if (url.match(/\/Users\/([0-9]+\/?)/g) != location.pathname) return; // 如果这个页面不是个用户的主页就退出掉（不匹配 /Users/NUMBER/ 或 /Users/NUMBER）
        if ($('.profile-head_join_HPHzg')[0]?.innerText?.includes('邀请')) return;
        let userId = url.match(/[0-9]+/); // 从 URL 匹配用户 ID
        window.$.ajax({
            method: 'POST',
            url: `/WebApi/Users/${userId}/GetPagedInvitedUsers`,
            data: {
                pageIndex: 1, pageSize: 10
            },
            success: (data) => {
                let length = data.invitorPath.length; // 邀请链深度
                // 若该用户不是在邀请链的第一层上，那就是被邀请的用户
                if (data.invitorPath.length != 1) {
                    let userId = data.invitorPath[length - 2].id,
                        userName = data.invitorPath[length - 2].username;
                    let showInvitingUser = addFindElement('.profile-head_join_HPHzg>small', (element) => {
                        element.innerHTML += ` · 由<a href="/Users/${encodeHTML(userId)}">${encodeHTML(userName)}</a>邀请`;
                        delete findElement[showInvitingUser];
                    });
                }
            }
        })

        // 在关注、粉丝、下面添加一个“显示邀请的用户”的入口
        let showInvitedUsers = addFindElement('div.grid-2fr1.grid-gap-xl', (element) => {
            if ($('#showInvitedUsers').length > 0) return; // 如果已经添加过了就退出掉（防止重复添加
            // 生成查看该用户邀请过的用户的链接
            let targetUrl = location.pathname;
            if (targetUrl.slice(-1) == '/') targetUrl = targetUrl.slice(0, -1);
            targetUrl += '/My/InvitedUsers'
            // 找到“关注”、“粉丝”的父级元素
            let parent = element.childNodes[1];
            // 生成“邀请”栏的元素
            let newElement = document.createElement('div');
            newElement.className = 'panel2_wrapper_3UZFE panel-border-bottom';
            newElement.id = 'showInvitedUsers';
            newElement.innerHTML = `
                <div class="panel2_panel_1hPqt">
                    <div class="panel2_panelHead_1Bn6y panel-head">
                        <h2>
                            <span class="panel2_border_2Slyp" style="background-color: rgb(77, 151, 255);"></span>邀请
                        </h2>
                        <a class="more" href="${encodeURI(targetUrl)}">查看»</a>
                    </div>
                </div>
            `;
            // 将此元素放到“关注”、“粉丝”后面
            if (window.innerWidth <= 768) { // 如果是手机端布局，那么关注、邀请后面还会有个评论，这个时候就需要特判一下，让邀请栏放在评论前面
                parent.insertBefore(newElement, parent.childNodes[2]);
            } else {
                parent.appendChild(newElement);
            }
            delete findElement[showInvitedUsers];
        });
    })

    // 修复作品“继续加载”的预览图尺寸问题
    addFindElement('.img-responsive', (element) => {
        element.style.width = '100%';
    })

    // 评论显示评论 ID
    let commentData = {};
    addStyle(`
        .explore-comment-info-icon {
            margin-right: .4em;
        }
    `);
    // 自动隐藏评论 ID，鼠标 hover 时再显示
    if (localStorage['explore:hoverId'] == 'true') {
        addStyle(`
            .explore-comment-id {
                display: none;
            }
            .comment_base_info:hover .explore-comment-id {
                display: inline-block;
            }
        `);
    }
    addStyle(`
        .explore-comment-id {
            color: #888;
            font-size: 12px;
            margin-left: .5em;
        }
        .comment_ipregion_11bpP {
            margin-left: .5em;
        }
    `);
    addFindElement('.comment_comment_P_hgY', (element) => {
        // 如果没获取到评论 ID（比如是奥灰推荐位等），就直接退出了
        if (element.id == '')
            return;
        // 给评论时间父级 div 评论信息添加 comment_base_info 类，以便控制显示隐藏
        element.querySelector('.comment_time_3A6Cg').parentNode.classList.add('comment_base_info');
        // 创建评论 ID
        let newElement = document.createElement('span');
        newElement.classList.add('explore-comment-id');
        newElement.classList.add(`explore-comment-id-${element.id}`);
        newElement.innerText = `#${element.id}`;
        // 创建评论 ID 被点击事件
        newElement.addEventListener('click', () => {
            if (!commentData[element.id]) {
                window.Blockey.Utils.Alerter.info('🚧 找不到这条评论的数据');
            } else {
                let linkToComment = (location.href.includes('#') ? location.href.split('#')[0] : location.href) + '#commentId=' + element.id;
                window.Blockey.Utils.confirm(
                    "评论",
                    `
                        <span class="glyphicon glyphicon-time explore-comment-info-icon"></span><b>评论时间</b>
                        <br/>
                        <span>
                            ${(new Date(commentData[element.id].createTime)).toLocaleString()}
                        </span>
                        <br/><br/>
                        <span class="glyphicon glyphicon-link explore-comment-info-icon"></span><b>评论链接</b>
                        <br/>
                        <a href="${linkToComment}">${linkToComment}</a>
                        <br/><br/>
                        <pre>${encodeHTML(commentData[element.id].content)}</pre>
                    `
                );
            }
        });
        // 在评论时间的右边、IP 属地的左边插入评论 ID
        if (element.querySelector('.comment_info_2Sjc0 > .comment_base_info > .comment_ipregion_11bpP') != null)
            insertBefore(newElement, element.querySelector('.comment_ipregion_11bpP'));
        else // 适配无 IP 属地评论
            element.querySelector('.comment_base_info').appendChild(newElement)
    })

    // 给用户主页用户名右边真人认证的图标的位置进行一个矫正
    addFindElement('.profile-head_name_3PNBk>i', (element) => {
        element.style.marginLeft = '0.2em';
        element.style.height = '1em';
    });

    // 用户备注功能
    // 给用户添加备注
    if (!localStorage['explore:remark'])
        localStorage['explore:remark'] = JSON.stringify({});
    addFindElement('.profile-head_name_3PNBk>span', (element) => {
        element.addEventListener('click', () => {
            if (Blockey.Utils.getContext().target.id === Blockey.INIT_DATA.loggedInUser.id) { // 不能给自己添加备注
                Blockey.Utils.Alerter.info('不能给自己添加备注');
                return;
            }
            window.Blockey.Utils.prompt('更新给 TA 的备注')
                .then((data) => {
                    let remark = JSON.parse(localStorage['explore:remark']);
                    remark[Blockey.Utils.getContext().target.id] = data == '' ? undefined : data;
                    localStorage['explore:remark'] = JSON.stringify(remark);
                    location.reload();
                })
        })
    })
    // 如果给自己备注过，那就删除这个备注
    if (JSON.parse(localStorage['explore:remark'])[Blockey.INIT_DATA.loggedInUser ? Blockey.INIT_DATA.loggedInUser.id : '']) {
        let remark = JSON.parse(localStorage['explore:remark']);
        delete remark[Blockey.INIT_DATA.loggedInUser.id];
        localStorage['explore:remark'] = JSON.stringify(remark);
    }
    // 在所有用户名后面添加备注
    let handleUserName = (element) => {
        let remark = JSON.parse(localStorage['explore:remark']);
        let usrId = element.nodeName == 'SPAN' ? Blockey.Utils.getContext().target.id : element.href.split('/')[element.href.split('/').length - 1];
        if (usrId in remark) {
            let newElement = document.createElement('small');
            newElement.style.fontSize = '50%';
            newElement.innerHTML = `(${encodeHTML(remark[usrId])})`
            element.appendChild(newElement);
        }
    };
    addFindElement('a.comment_name_2ZnFZ', handleUserName)
    addFindElement('a.user-info_wrapper_2acbL:not(.event-component_info_2c3Jo > a)', handleUserName)
    addFindElement('.profile-head_name_3PNBk>span:first-child', handleUserName)

    // 去除 maxHeight 限制
    if (localStorage['explore:noMaxHeight'] == 'true') {
        addStyle(`
            .user-home_userInfo_2szc4 { max-height: none !important }
        `);
    }


    // 只显示一行推荐的精华作品
    if (localStorage['explore:lessRecommendProject'] == 'true') {
        addStyle(`
            .home_wrapper_2gKE7 > div:first-child div.home_padding_2Bomd li:nth-child(-n+6) {
                display:none;
            }
        `);
        // nth-child：https://developer.mozilla.org/zh-CN/docs/Web/CSS/:nth-child
        // CSS 选择器挺复杂但是也挺有意思的，值得研究
    }

    // 提示卸载旧版
    if (localStorage['explore:multiVersionAlert'] != 'blocked') {
        setTimeout(() => {
            if (document.querySelectorAll('#nav-explore-setting').length >= 2) { // 如果发现了菜单中有两个插件设置那就说明安装了旧版或多个版本
                window.Blockey.Utils.confirm(`提示`, `
                <b>您似乎安装了旧版本或多个版本的插件？这可能会出现冲突问题，建议卸载较旧版本的插件。</b>
                <br/>
                <small>
                    在控制台输入 <code>localStorage['explore:multiVersionAlert'] = 'blocked'</code> 以禁用该警告（不推荐）
                </small>
                <img
                    src="https://asset.gitblock.cn/Media?name=4D19BB71482063DD3FB4187575A408E2.png"
                    width="80%"
                    style="margin: .5em; border: 1px solid #ccc"
                />
        `);
            }
        }, 1000)
    }

    // 输入框长度自适应输入的文字行数
    const autoHeight = (e) => {
        if (
            e.parentNode.parentNode.parentNode.classList.contains('project-view_descp_IZ1eH') ||
            e.parentNode.parentNode.parentNode.classList.contains('forum-post-add_wrapper_2IFFJ') ||
            e.parentNode.parentNode.parentNode.classList.contains('studio-home_studioCard_2r8EZ')
        ) { // 若为作品简介、帖子、工作室简介编辑则不自动调整
            return;
        }
        e.style.minHeight = '75px'
        if (e.value.length <= 512) {
            e.style.height = 'auto';
            e.style.height = e.scrollHeight <= 75 ? '75px' : (e.scrollHeight + 4) + `px`;
        }
    };
    addSelectorEvent('textarea.form-control', ['input', 'focus'], (e) => autoHeight(e.target));
    addFindElement('textarea.form-control', (element) => autoHeight(element));
    // 发送消息后自动复位
    addFindElement('textarea.form-control', (element) => {
        element.parentElement.parentElement.parentElement.querySelector('.btn.btn-submit.btn-sm')?.addEventListener('click', () => {
            element.style.height = '75px';
        })
    });

    // 复制页面链接按键
    if (localStorage['explore:copyLink'] == 'true') {
        // 创建元素
        let copyBtn = document.createElement('button');
        copyBtn.classList.add('explore-copy');
        copyBtn.addEventListener('click', () => {
            let title = document.title;
            let link = location.pathname + location.search + location.hash;
            if (location.pathname.search(/Studios\/[0-9]+\/Forum\/PostView/) == 1) { // 论坛帖子的网页标题都是“论坛 - 稽木世界”，这里给它加上帖子标题
                title = $('.title')[0].innerText + ' - ' + title
            }
            title = title.replace(' - 阿儿法营', '');
            title = title.replace(' - 稽木世界', '')
            navigator.clipboard.writeText(`[${title}](${link})`);
            window.Blockey.Utils.Alerter.info('已复制到剪贴板');
        });
        copyBtn.innerHTML = `
            <i class="lg share color-gray"></i>
        `;
        // 添加元素到页面
        let addCopyButtonToDocument = () => {
            try {
                $('.container')[1].appendChild(copyBtn);
            } catch (e) {
                setTimeout(addCopyButtonToDocument, 200);
            }
        };
        addCopyButtonToDocument();
        // 创建样式
        addStyle(`
            .explore-copy {
                width: 3em;
                height: 3em;
                right: 0;
                bottom: 0;
                background: white;
                position: fixed;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 1em;
                border-radius: 50%;
                box-shadow: 1px 1px 15px rgb(0,0,0,0.15);
                transition: opacity 0.15s ease-in-out;
                border: none;
            }

            .explore-copy:hover {
                opacity: 0.99;
            }

            .explore-copy {
                opacity: 0;
            }

            .explore-copy > i {
                padding-left: 0.2em; /* 和自带的 padding-right 中和一下 */
                font-size: 1.6em;
                line-height: initial;
            }
        `);
    }

    // 贴吧表情
    if (localStorage['explore:tiebaEmoji'] == 'true') {
        addFindElement('.control-group', (element) => {
            // 创建表情选择器元素
            let emojiSelector = document.createElement('div');
            let selectorId = (Math.random() * 10 ^ 8).toFixed().toString(16);
            emojiSelector.classList.add('explore-emoji-selector-' + selectorId);
            emojiSelector.classList.add('explore-emoji-selector');
            emojiSelector.style.display = 'none';
            // 创建表情元素
            for (let i = 1; i <= 50; i++) {
                // 使表情 ID 始终为两位
                if (i < 10) {
                    i = '0' + i;
                }
                // 创建元素并设置 URL 和点击后在输入框添加对应 Markdown
                let emoji = document.createElement('img');
                emoji.src = `https://tb2.bdstatic.com/tb/editor/images/face/i_f${i}.png?t=20140803`;
                emoji.addEventListener('click', (e) => {
                    let textarea = e.target.parentNode.parentNode.parentNode.parentNode.querySelector('textarea');
                    // value +=
                    textarea.value = textarea.value.slice(0, textarea.selectionStart) + `![贴吧表情](${e.target.src})` + textarea.value.slice(textarea.selectionStart);
                    // 关闭并 focus 到输入框
                    emojiSelector.style.display = 'none';
                    textarea.focus();
                    // 触发 onChange 事件
                    let evt = new Event('change');
                    textarea.dispatchEvent(evt);
                    let eventHandlerKey = Object.keys(textarea).find((item) => item.includes('_reactEventHandlers'));
                    let eventHandler = textarea[eventHandlerKey];
                    eventHandler.onChange(evt);
                })
                // 创建一个“如果鼠标摁下但是摁的不是自己就关闭自己”的事件
                addEventListener('click', (e) => {
                    if (e.target != emojiSelector && !e.target.classList.contains('explore-open-selector')) {
                        emojiSelector.style.display = 'none';
                    }
                })
                emojiSelector.appendChild(emoji);
            }
            insertBefore(emojiSelector, element.childNodes[0]);
            // 创建打开表情选择器按钮
            let openSelector = document.createElement('span');
            openSelector.classList.add('btn');
            openSelector.classList.add('btn-sm');
            openSelector.innerText = '表情';
            openSelector.classList.add('explore-open-selector');
            openSelector.addEventListener('click', () => {
                let element = document.querySelector('.explore-emoji-selector-' + selectorId);
                element.style.display = element.style.display == 'flex' ? 'none' : 'flex';
            });
            insertBefore(openSelector, element.childNodes[0]);
        })
        addStyle(`
        .explore-emoji-selector {
            display: flex;
            position: absolute;
            flex-wrap: wrap;
            z-index: 1999;
            background: white;
            box-shadow: 0px 0px 10px rgb(0 0 0 / 25%);
            border-radius: 4px;
            padding: 0.5em;
            margin-right: 4em;
            left: 30%;
            margin-top: 0.5em;
            max-width: 30em;
            justify-content: center;
        }
        .explore-emoji-selector > img {
            margin: 0.3em !important;
            width: 2em;
            cursor: pointer;
        }
        .comment_comment_P_hgY .comment_info_2Sjc0 {
            overflow: inherit;
        }
    `);
    }

    // 在作品全屏显示时禁用鼠标滚轮滚动
    if (localStorage['explore:fullscreenDisableScroll'] == 'true') {
        let scrollY = 0;
        addEventListener('scroll', () => {
            if ($('.stage-wrapper_full-screen_3WIKP').length > 0) {
                document.documentElement.scrollTop = scrollY;
            } else {
                scrollY = document.documentElement.scrollTop;
            }
        })
    }

    // 自动检查更新
    // Get 请求工具函数
    const RequestInGet = (url) => {
        let XHR = new XMLHttpRequest();
        XHR.open('GET', url, false);
        XHR.send();
        return XHR.responseText;
    }; // 不知道为啥用 $.ajax 去请求一个 Javascript 文件会自动执行一遍那个 Javascript 文件...
    // 获取更新函数，如果有更新则返回一个对象，否则返回 false
    const checkUpdate = () => {
        // 获取最新版本号（本来用 jsdeliver 的，但是因为缓存的原因，有时候你都更新了 Github 上的最新版本了，但是 jsdeliver 里存的还是旧版，这就导致了会提示用户逆向升级的问题）
        let lastestFile = atob(JSON.parse(RequestInGet('https://api.github.com/repos/waterblock79/aerfaying-explore/contents/aerfaying-explore.user.js?ref=main')).content);
        let lastestVersion = lastestFile.match(/@version\s+([\d.]+)/)[1]; // copilot 都比你会写正则.jpg
        console.log(`从 Github 仓库检查插件更新成功，最新版本 ${lastestVersion}，当前版本 ${version}`);
        // 获取 Commit 消息
        if (version != lastestVersion) {
            let lastestCommit = JSON.parse(
                RequestInGet('https://api.github.com/repos/waterblock79/aerfaying-explore/commits')
            )[0];
            return {
                version: lastestVersion,
                message: lastestCommit.commit.message,
                date: new Date(lastestCommit.commit.author.date),
            }
        }
        return false;
    };

    // 检查更新
    if (localStorage['explore:disabledAutoCheckUpdate'] != 'true' && (localStorage['explore:lastCheckUpdate'] == undefined || new Date().getTime() - new Date(Number(localStorage['explore:lastCheckUpdate'])).getTime() > 1000 * 60 * 60)) {
        (async () => {
            let lastestVersion = checkUpdate();
            localStorage['explore:lastCheckUpdate'] = new Date().getTime();
            if (lastestVersion) {
                // 显示提示框
                Blockey.Utils.confirm(`发现新版本`,
                    `
                    <p style="
                        margin: 0 auto 1em auto;
                        display: flex;
                        width: 10em;
                        justify-content: space-between;
                    ">
                        <span style="color: darkgrey;">${version}</span>
                        <span>→</span>
                        <span style="color: limegreen;">${encodeHTML(lastestVersion.version)}</span>
                    </p>
                    <p style="font-size: 100%">
                        ${encodeHTML(lastestVersion.message)}<br/>
                        <small>更新于：${lastestVersion.date.toLocaleString()}</small>
                        <small style="display: block">根据 Github 仓库提交信息显示，请以实际更新内容为准！</small>
                    </p>
                    <p>
                        <small>获取更新的数据来源以及更新渠道均为 Github，因此可能无法打开链接，或者一些浏览器插件可能就不支持直接通过打开链接更新插件，如果您遇到了这些情况，请尝试移除该插件并重新按照<a href="https://waterblock79.github.io/aerfaying-explore/#%E5%AE%89%E8%A3%85%E6%8F%92%E4%BB%B6">文档中的教程</a>进行安装，亦或禁用自动检查更新功能。</small>
                    </p>
                `
                );
                // 给 ok-button 加事件
                $('.ok-button')[0].addEventListener('click', () => {
                    window.open('https://github.com/waterblock79/aerfaying-explore/raw/main/aerfaying-explore.user.js');
                })
                // 不再提示摁钮
                let dontShowAgain = document.createElement('button');
                dontShowAgain.classList.add('btn');
                dontShowAgain.classList.add("ok-button");
                dontShowAgain.innerText = '不再提示';
                dontShowAgain.style.background = "coral";
                dontShowAgain.style.color = "white";
                dontShowAgain.addEventListener('click', () => {
                    localStorage['explore:disabledAutoCheckUpdate'] = 'true';
                    $('.footer.text-right.box_box_tWy-0>button')[1].click();
                });
                insertBefore(dontShowAgain, $('.footer.text-right.box_box_tWy-0>button')[0]);
            }
        })();
    }

    // 在手机端的物品页面也显示物品图鉴、拍卖行按钮
    addHrefChangeEvent(() => {
        if (window.location.href.match(/\/Users\/[0-9]*\/My\/Items/)) { // 匹配 /Users/[NUMBER]/My/Items
            addFindElement('.user-items_wrapper_2Jxfd', (element) => {
                // 创建元素
                let newElement = document.createElement('div');
                newElement.classList.add('navigation-list_wrapper_1RqLP');
                newElement.classList.add('explore-mobile-items-nav');
                newElement.innerHTML = `
                <li class="guide">
                    <i class="guide"></i>
                    <div class="navigation-list_content_2S2K9">
                        <div class="navigation-list_title_SOF67">物品图鉴</div>
                    </div>
                </li>
                <li class="sell">
                    <i class="auction"></i>
                    <div class="navigation-list_content_2S2K9">
                        <div class="navigation-list_title_SOF67">拍卖行</div>
                    </div>
                </li>
            `;
                // 特别的 CSS
                addStyle(`
                @media (min-width: 769px) {
                    .explore-mobile-items-nav {
                        display: none;
                    }
                }
                @media (max-width: 768px) {
                    .navigation-list_wrapper_1RqLP {
                        display: flex;
                        justify-content: center;
                    }
                    .navigation-list_wrapper_1RqLP>li {
                        margin: 0 1em 1em 1em;
                        width: 100%;
                    }
                }
            `);
                insertBefore(newElement, element);
                // 绑定点击事件
                $('.explore-mobile-items-nav>li.guide')[0].addEventListener('click', () => {
                    window.location.href = '/Items/Guide';
                });
                $('.explore-mobile-items-nav>li.sell')[0].addEventListener('click', () => {
                    window.location.href = '/stars/mars/0001';
                });
            })
        }
    });

    // 任务列表中若经验/金币奖励为 0 则不显示这个图标（原来就是这样的，前些日子改成了即使奖励为 0 也显示一个图标加上一个数字 0）
    addFindElement('.mission-prizes_wrapper_2HfN8 > .prize_wrapper_Nbm6l', (element) => {
        if (element.querySelector('span').innerText === '0') {
            element.style.display = 'none';
        }
    });

    // 自动跳转
    if (window.GMAvailable) {
        // 受理设置
        window.SetRedirect = (target) => {
            GM_setValue('explore:autoRedirect', target);
        }
        // 进行跳转
        let autoRedirect = GM_getValue('explore:autoRedirect', 'none');
        if (autoRedirect == 'aerfaying' && window.location.host != 'aerfaying.com') {
            window.location.host = 'aerfaying.com';
        } else if (autoRedirect == '3eworld' && window.location.host != '3eworld.cn') {
            window.location.host = '3eworld.cn';
        } else if (autoRedirect == 'gitblock' && window.location.host != 'gitblock.cn') {
            window.location.host = 'gitblock.cn';
        }
    }

    // 评论区编辑消息时允许预览消息
    if (localStorage['explore:previewCommentMarkdown'] == 'true') {
        addStyle(`
            .comment-panel_comment-panel_3pBsc form {
                margin-top: 0;
            }

            .comment-panel_comment-panel_3pBsc form .markdown-editor_previewTab_e6pLX {
                margin-left: 4px;
            }
        `);
        addFindElement(`.reply-box_replyBox_3Fg5C`, (element) => {
            // 创建预览摁钮组及其子摁钮
            let previewButtonGroup = {
                parent: document.createElement('ul'),
                edit: document.createElement('li'),
                preview: document.createElement('li'),
            }
            // parent
            previewButtonGroup.parent.classList.add('nav');
            previewButtonGroup.parent.classList.add('nav-tabs');
            previewButtonGroup.parent.classList.add('markdown-editor_previewTab_e6pLX');
            // edit
            previewButtonGroup.edit.classList.add('active');
            previewButtonGroup.edit.innerHTML = `
                <a>编辑</a>
            `;
            previewButtonGroup.edit.addEventListener('click', (e) => {
                previewButtonGroup.edit.classList.add('active');
                previewButtonGroup.preview.classList.remove('active');
                element.querySelector('textarea').style.display = 'block';
                element.querySelector('div.explore-comment-preview').style.display = 'none';
            })
            // preview
            previewButtonGroup.preview.innerHTML = `
                <a>预览</a>
            `;
            previewButtonGroup.preview.addEventListener('click', (e) => {
                previewButtonGroup.edit.classList.remove('active');
                previewButtonGroup.preview.classList.add('active');
                element.querySelector('textarea').style.display = 'none';
                element.querySelector('div.explore-comment-preview').style.display = 'block';
                element.querySelector('div.explore-comment-preview').innerHTML = window.Blockey.Utils.markdownToHtml(element.querySelector('textarea').value);
            });
            // 把子摁钮加入摁钮组
            previewButtonGroup.parent.appendChild(previewButtonGroup.edit);
            previewButtonGroup.parent.appendChild(previewButtonGroup.preview);
            // 把摁钮组加入页面
            insertBefore(previewButtonGroup.parent, element);

            // 添加预览元素
            let previewElement = document.createElement('div');
            previewElement.classList.add('explore-comment-preview');
            previewElement.style.display = 'none';
            previewElement.style.minHeight = '75px';
            element.appendChild(previewElement);

            // 发送消息后自动复位
            element.parentElement.querySelector('.btn.btn-submit.btn-sm')?.addEventListener('click', () => {
                previewButtonGroup.edit.click();
            })
        })
    }

    // 消息页面预览回复
    if (localStorage['explore:previewReply'] == 'true') {
        let messagePool = {};
        // 请求频率锁
        let requestLock = {
            time: Date.now(),
            times: 0
        };
        // 截短字符串
        let Shorter = (str, length) => {
            if (!length) length = 30;
            return str.length > length ? `${str.substring(0, length)}...` : str;
        };
        let HandleMessagePreview = async (messageListElement) => {
            let messageList = [];
            // 从消息元素提取该消息的信息，并加入到列表
            messageListElement.childNodes.forEach((messageElement) => {
                // 根本没链接那就直接退出
                if (!messageElement.querySelector('.user-messages_content_3IDNx p > a')) return;
                // 提取链接
                let href = messageElement.querySelector('.user-messages_content_3IDNx p > a').getAttribute('href');
                // 如果不是消息回复就跳过
                if (!messageElement.querySelector('.user-messages_content_3IDNx p').innerText.match(/在[\S\s]*给你 留言 了/))
                    return;
                // 提取信息并加入列表
                messageList.push({
                    element: messageElement,
                    forType: {
                        'Users': 'User',
                        'Projects': 'Project',
                        'Reports': 'Report'
                    }[href.split('/')[1]] || null,
                    forId: href.split('/')[2].split('#')[0],
                    scrollToCommentId: href.split('#')[1].split('=')[1]
                });
            });
            // 按 forId 整理，forId 相同的消息按顺序同步处理（节约请求）
            let messageListByForId = {};
            messageList.forEach((message) => {
                if (!messageListByForId[message.forType + message.forId]) {
                    messageListByForId[message.forType + message.forId] = [];
                }
                messageListByForId[message.forType + message.forId].push(message);
            });
            console.log(messageListByForId);
            // 屮，走，忽略
            Object.keys(messageListByForId).forEach((forId) => {
                for (let i in messageListByForId[forId]) {
                    let message = messageListByForId[forId][i];
                    // 巧了，消息池里已经有这个消息的信息了，那就别请求了，直接用消息池中的数据就好了
                    if (messagePool[message.scrollToCommentId]) {
                        let previewElement = document.createElement('p');
                        previewElement.innerText = Shorter(encodeHTML(messagePool[message.scrollToCommentId]));
                        previewElement.classList.add('explore-comment-preview');
                        message.element.querySelector('.user-messages_content_3IDNx p').appendChild(previewElement);
                    } else {
                        // 没有那就调 api 请求
                        // 请求频率锁（如果近一秒内平均请求了超过三次，那就稍等一会）
                        if (requestLock.time + 1000 < Date.now()) requestLock.time = Date.now();
                        while ((Date.now() - requestLock.time) / requestLock.times < 300) { }
                        window.$.ajax({
                            url: `/WebApi/Comment/GetPage`, method: 'post', data: {
                                forType: message.forType,
                                forId: message.forId,
                                pageIndex: 1,
                                scrollToCommentId: message.scrollToCommentId
                            },
                            async: false,
                            success: (data) => {
                                // 把返回的这些数据加入消息池
                                data.pagedThreads.items.forEach((m) => {
                                    messagePool[m.id] = m.status ? m.content : '[评论不存在]';
                                });
                                data.replies.forEach((m) => {
                                    messagePool[m.id] = m.status ? m.content : '[评论不存在]';
                                });
                                messagePool[data.scrollToThread.id] = data.scrollToThread.status ? data.scrollToThread.content : '[评论不存在]';
                                // 把评论内容加入页面
                                let previewElement = document.createElement('p');
                                previewElement.innerText = Shorter(encodeHTML(messagePool[message.scrollToCommentId]));
                                previewElement.classList.add('explore-comment-preview');
                                message.element.querySelector('.user-messages_content_3IDNx p').appendChild(previewElement);
                            }
                        });
                    }
                }
            });
        };
        // 页面中的消息更新时触发插入回复预览
        addFindElement(`.user-messages_card_2ITqW`, (element) => {
            if (!(element.parentNode.childNodes[0] == element)) return;
            /*
                元素的结构是这样的：
                div.user-messages_wrapper_1hI8b
                    div.user-messages_card_2ITqW // 每个消息卡片
                    div.user-messages_card_2ITqW
                    ......
                如果要侦测 .user-messages_wrapper_1hI8b 是否变化，这个怪麻烦的（直接判断现在的元素是否先前的元素相等的话，这个里面怎么变，判断的时候都是相等的；判断 innerHTML 是否改变的话，把消息内容插入页面的时候它还会再触发一次，就无限循环了）
                所以就用 .user-messages_card_2ITqW 是否变化来侦测这个消息列表是否更新了
                这里判断了一下是否 .user-messages_card_2ITqW 是 .user-messages_wrapper_1hI8b 中第一个元素，防止重复触发
            */
            HandleMessagePreview(element.parentNode);
        });
        // 对应样式
        addStyle(`
            .explore-comment-preview {
                margin-top: 0.25em !important;
                font-size: 0.75em !important;
            }
        `);
    }

    // 修复在切换过页面大小的情况下，点击绿旗后作品播放器上的遮盖仍存在的问题（详见 issue #31）
    addFindElement('.stage_green-flag-overlay-wrapper_3bCO-.box_box_tWy-0', (element) => {
        element.addEventListener('click', (e) => {
            element.style.display = 'none';
        })
    });

    // 快捷搜索
    if (localStorage['explore:localSearch'] == 'true') {
        /**
         * @returns {Promise<IDBDatabase>}
         */
        const openDb = () => {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open('explore-quick-search');
                req.onsuccess = () => {
                    resolve(req.result);
                };
                req.onupgradeneeded = () => {
                    if (!req.result.objectStoreNames.contains('data')) {
                        req.result.createObjectStore('data', {
                            keyPath: 'url'
                        });
                    }
                }
            })
        }

        // 转换老数据
        if (localStorage['explore:searchDb']) {
            try {
                openDb().then((db) => {
                    const transaction = db.transaction(['data'], 'readwrite')
                        .objectStore('data');
                    JSON.parse(localStorage['explore:searchDb']).forEach(item => {
                        transaction.put({
                            url: item.href,
                            keywords: [
                                item.keywords[0],
                                item.keywords[1]
                            ],
                            name: item.title,
                            type: item.type,
                            image: item.image,
                            lastVisit: 0
                        })
                    });
                    localStorage.removeItem('explore:searchDb');
                })
            } catch (e) { }
        }

        // 创建搜索结果HTMl的函数
        const createSearchResultHTMLCode = (item) => `
            <a class="result" href="${encodeURI(item.url)}">
                ${item.image ?
                `<img src="https://cdn.gitblock.cn/Media?name=${encodeURI(item.image)}" />` :
                /*`<i class="mission lg" style="margin: 0 0.55em 0 0.25em; color: lightslategrey;"></i>`*/``
            }
                <div style="overflow: hidden">
                    <div style="font-size: 1.25em">${encodeHTML(item.name)}</div>
                    <div style="font-size: 0.75em; opacity: 0.75">${encodeHTML(item.url)} - 最后访问：${item.lastVisit === 0 ? '很久以前' : Date.now() - item.lastVisit < 24 * 60 * 60 * 1000 ?
                '' + (new Date(item.lastVisit)).toLocaleTimeString().split(':').splice(0, 2).join(':') :
                Math.floor((Date.now() - item.lastVisit) / 24 / 60 / 60 / 1000) + ' 天前'
            }</div>
                </div>
            </a>
        `; // 土制 JSX

        // 创建元素
        const searchRootElement = document.createElement('div');
        searchRootElement.className = 'explore-quick-search';
        searchRootElement.innerHTML = `
            <input
                placeholder="搜点什么"
            />
            <div class="results">
                <div class="result-container">
                    <div class="result-message">输入一个关键词以开始搜索</div>
                </div>
            </div>
        `;
        searchRootElement.style.display = 'none';
        addStyle(`
            .explore-quick-search {
                position: fixed;
                left: 0;
                top: 0;
                height: 100%;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                background: rgb(0, 0, 0, 0.35);
                z-index: 10000;
            }
            .explore-quick-search > input {
                border-radius: 8px;
                outline: none;
                border: none;
                background: rgb(255,255,255,0.92);
                backdrop-filter: blur(5px);
                padding: 1em 1.25em;
                font-size: 1.2em;
                width: 75%;
            }
            .explore-quick-search > .results {
                margin-top: 1em;
                overflow: hidden;
                height: 60%;
                width: 75%;
                border-radius: 8px;
                background: rgb(255,255,255,0.9);
                backdrop-filter: blur(5px);
            }
            .explore-quick-search .result-container {
                width: 100%;
                height: 100%;
                padding: 1em;
                overflow-y: auto;
                max-height: 100%;
                display: flex;
                flex-direction: column;
                align-items: stretch;
            }
            .explore-quick-search .result {
                display: flex;
                align-items: center;
                cursor: pointer;
                text-decoration: none;
                color: #24292f;
                margin: 0.5em 0;
                padding: 0.75em 1em;
                margin-top: 0;
                border-radius: 4px;
                transition: background 0.1s;
            }
            .explore-quick-search .result:hover {
                background: rgb(0,0,0,0.1);
            }
            .explore-quick-search .result > img {
                width: 2.5em;
                margin-right: 1em;
            }
            .explore-quick-search .result > div > .title {
                font-size: 1.25em;
            }
            .explore-quick-search .result > div > .subtitle {
                font-size: 0.75em;
                opacity: 0.75;
            }
            .explore-quick-search .result-message {
                display: flex;
                justify-content: center;
                height: 90%;
                align-items: center;
                padding: 0 2em;
            }
        `);
        addHrefChangeEvent(() => {
            const availableTargetType = ['Studio', 'User', 'Project', 'ForumPost'];
            const availableUrlFormat = [
                /\/studios\/[0-9]*\/?/i,
                /\/users\/[0-9]*\/?/i,
                /\/projects\/[0-9]*\/?/i,
                /\/studios\/[0-9]*\/forum\/postview\?postid=[0-9]*/i
            ];
            const getTargetTypeFromUrl = (url) => {
                let flag = false;
                availableTargetType.forEach((item, index) => {
                    if (url.match(availableUrlFormat[index]) && url.match(availableUrlFormat[index])[0] == url) {
                        flag = item;
                    }
                });
                return flag || null;
            }
            let waitInterval = setInterval(() => {
                const url = location.href.replace(location.origin, '').replace(location.hash, '');
                if (!getTargetTypeFromUrl(url)) {
                    clearInterval(waitInterval);
                    return;
                }
                if (getTargetTypeFromUrl(url) !== Blockey.Utils.getContext().targetType) {
                    return;
                }
                clearInterval(waitInterval);
                if (availableTargetType.includes(Blockey.Utils.getContext().targetType)) {
                    const name = Blockey.Utils.getContext().target.name || Blockey.Utils.getContext().target.title || Blockey.Utils.getContext().target.username;
                    openDb().then((db) => {
                        const req = db.transaction(['data'], 'readwrite')
                            .objectStore('data')
                            .put({
                                url: url,
                                keywords: [
                                    Blockey.Utils.getContext().target.id,
                                    name,
                                    Blockey.Utils.getContext()?.target?.creator?.username || Blockey.Utils.getContext()?.target?.creatorId
                                ],
                                name: name,
                                type: Blockey.Utils.getContext().targetType,
                                image: Blockey.Utils.getContext().target.thumbId || null,
                                lastVisit: Date.now()
                            });
                    })
                }
            }, 100);
        });
        addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key == 'k') {
                searchRootElement.style.display = '';
                searchRootElement.querySelector('input').focus();
                e.preventDefault();
            }
            if (e.key == 'escape') {
                searchRootElement.style.display = 'none';
                e.preventDefault();
            }
        });
        document.body.append(searchRootElement);
        searchRootElement.querySelector('input')?.addEventListener('input', (e) => {
            const content = e.target.value;
            const result = [];
            if (content == '') {
                const container = searchRootElement.querySelector('.explore-quick-search .result-container');
                container.innerHTML = '<div class="result-message">输入一个关键词以开始搜索</div>';
                return;
            }
            openDb().then(db => {
                const req = db.transaction(['data'])
                    .objectStore('data')
                    .getAll();
                req.onsuccess = () => {
                    const container = searchRootElement.querySelector('.explore-quick-search .result-container');
                    container.innerHTML = '';
                    req.result.forEach(item => {
                        let flag = false;
                        item.keywords.forEach(keyword => {
                            keyword = keyword?.toString()?.toLocaleLowerCase();
                            if (keyword != '' && typeof keyword == 'string' && keyword.includes(content.toLocaleLowerCase()) || content.toLocaleLowerCase().includes(keyword)) {
                                flag = true;
                            }
                        });
                        if (flag) {
                            result.push(item);
                        }
                    });
                    if (result.length == 0) {
                        container.innerHTML += '<div class="result-message">没有搜索到匹配的结果</div>'
                    } else {
                        result.sort((a, b) => b.lastVisit - a.lastVisit);
                        result.slice(0, 75).forEach((item) => {
                            container.innerHTML += createSearchResultHTMLCode(item);
                        });
                        if (result.length> 75) {
                            container.innerHTML += `
                            <div style="margin: 0.25em 0.75em;">
                                最多显示 75 条搜索结果
                            </div>`
                        }
                    }
                };
            })
        });
        searchRootElement.addEventListener('click', e => {
            if (e.target.className === 'explore-quick-search') {
                searchRootElement.style.display = 'none';
            }
        })
    }

    // 查看用户等级信息
    addFindElement(`.profile-head_user_ktYc1 .user-flag-level_level_1N07n.user-flag-level_level-1_zBVua`, (element) => {
        let target = Blockey.Utils.getContext().target;
        window.$(element).tooltip({});
        element.setAttribute('data-tip', `共 ${target.expPoints} 经验，当前等级经验：${target.expPointsCurLevel} / ${target.expPointsNextLevel}`)
    });

    // 优化评论赞踩显示机制
    if (localStorage['explore:betterPriseAndBlame'] == 'true') {
        addFindElement('.comment_handle-group_1XxIF', (element) => {
            // 原始赞踩元素
            const praiseElement = element.querySelector('.comment_praise_3CkqM'),
                blameElement = element.querySelector('.comment_blame_1WADJ');
            // 插件的点赞、点踩和计数器元素
            const praiseBtn = document.createElement('i'),
                blameBtn = document.createElement('i'),
                sumElement = document.createElement('span');
            // 获取原始赞踩数
            const praiseSum = () => Number(praiseElement.innerText),
                blameSum = () => Number(blameElement.innerText);
            // 更新赞踩状态
            const updateStat = (praise, blame) => {
                praiseBtn.className = `praise ${praise && 'color-primary'}`;
                blameBtn.className = `blame ${blame && 'color-primary'}`;
            };
            // 更新赞踩计数
            // 如果 waitUntilUpdate 为真，则会先等待一小会，直到原始数据更新，然后再更新计数，不会立马更新
            const updateSum = (waitUntilUpdate) => {
                if (waitUntilUpdate) {
                    let startTime = Date.now(),
                        last = praiseSum() - blameSum();
                    let waitUpdateInterval = setInterval(() => {
                        if (Date.now() - startTime > 3000) clearInterval(waitUpdateInterval);
                        if (praiseSum() - blameSum() != last) {
                            updateSum();
                            clearInterval(waitUpdateInterval);
                        }
                    })
                } else {
                    sumElement.innerText = (praiseSum() - blameSum() > 0) ? praiseSum() - blameSum() : '';
                }
            };
            // 设置相关样式
            sumElement.className = 'comment_praise_3CkqM';
            // 隐藏原始元素
            praiseElement.style.display = 'none';
            blameElement.style.display = 'none';
            // 初始化赞踩状态、计数器
            praiseBtn.className = praiseElement.querySelector('i').className;
            blameBtn.className = blameElement.querySelector('i').className;
            updateSum();
            // 点赞、点踩事件
            praiseBtn.addEventListener('click', () => {
                praiseElement.click();
                updateStat(true, false);
                updateSum(true);
            });
            blameBtn.addEventListener('click', () => {
                blameElement.click();
                updateStat(false, true);
                updateSum(true);
            });
            // 放进容器里，然后插入进页面
            const container = document.createElement('span');
            container.append(praiseBtn);
            container.append(sumElement);
            container.append(blameBtn);
            insertBefore(container, element.querySelector('.comment_reply_1AC1U'))
        })
        addStyle(`
            .comment_handle-group_1XxIF>span {
                margin-right: 0.5em !important;
                margin-left: 0 !important;
            }
            .comment_praise_3CkqM {
                margin-left: 0.2em;
                margin-right: 1em;
            }
        `)
    }

    //   本来这里是要写一个用 NotificationAPI 来推送 A 营消息的功能的，但是不能使用带加密的 API（只能开个iframe读内容），
    // 而且获取消息的时候还会把小红点消掉（如果要全面接管小红点那太麻烦了），太麻烦了，而且后续维护的时候可能问题还会非常多，
    // 有点捡了芝麻丢了西瓜的感觉...

    // 修复过长且不能自动换行的选票评价会导致否决键被顶到屏幕外面的问题
    addStyle(`
        .responsive-table_wrapper_101dU td {
            word-break: break-word;
        }
    `)
    addFindElement(`.responsive-table_wrapper_101dU td`, (element) => {
        if (element.innerText.length > 256) {
            let origin = element.innerText;
            element.innerText = Blockey.Utils.encodeHtml(origin.substr(0, 256)) + '...';
            element.addEventListener('click', () => {
                Blockey.Utils.confirm(`查看完整选票评价`, `
                    <div style="word-break: break-word; margin-bottom: 1em">
                        ${Blockey.Utils.encodeHtml(origin)}
                    </div>
                `);
            });
        }
    })

    // Markdown 沙盒
    if (location.pathname == '/Sandbox') {
        $('title')[0].innerHTML = `Markdown 沙盒 - Aerfaying Explore`;
        $('.container')[1].innerHTML = `
            <h4 style="margin: 0.5em 0.5em">
                Markdown 沙盒
                <p style="
                    font-size: 0.75rem;
                    line-height: 2em;
                ">
                    您可以在 Markdown 沙盒中使用 A 营的 Markdown 并实时预览。编辑会实时保存到本地存储中，请勿在这里输入隐私信息或者重要内容。
                </p>
            </h4>
            <div class="sandbox-container">
                <textarea class="form-control" name="value"></textarea>
                <div></div>
            </div>
        `;
        addStyle(`
            .sandbox-container {
                display: flex;
                flex-wrap: nowrap;
                height: 100%;
                padding: 0.5em;
                margin-bottom: 2em;
            }
            .sandbox-container > textarea {
                width: 50%;
                resize: vertical;
            }
            .sandbox-container > div {
                width: 50%;
                background: #fff;
                border-radius: 4px;
                border: rgb(0,0,0,0.25) solid 1.25px;
                padding: 1em 1.5em;
            }
        `);
        if (localStorage['explore:sandbox']) {
            $('.sandbox-container > textarea')[0].value = localStorage['explore:sandbox'];
            $('.sandbox-container > div')[0].innerHTML = window.Blockey.Utils.markdownToHtml(localStorage['explore:sandbox']);
        }
        $('.sandbox-container > textarea')[0].addEventListener('input', (e) => {
            $('.sandbox-container > div')[0].innerHTML = window.Blockey.Utils.markdownToHtml(e.target.value);
            localStorage['explore:sandbox'] = e.target.value;
        })
    };
    addFindElement('.sidebar-nav_navigations_1X4Qe', (element) => {
        let e = document.createElement('div');
        e.className = 'sidebar-nav_nav_1dRFd sidebar-nav_on_2_HNF';
        e.innerHTML = `
            <div class="sidebar-nav_navName_2Wr6t">
                <a class="" href="/Sandbox"><i class="edit lg"></i>沙盒</a>
            </div>
        `;
        element.append(e);
    })
    // Your code here...
})();

// @ts-nocheck
// ==UserScript==
// @name         Aerfaying Explore - 阿儿法营/稽木世界社区优化插件
// @namespace    waterblock79.github.io
// @version      1.21.1
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

/*
    Purge jsDeliver CDN cache: https://www.jsdelivr.com/tools/purge
     - https://cdn.jsdelivr.net/gh/waterblock79/aerfaying-explore/aerfaying-explore.user.js
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
    const version = '1.21.1';

    const DEFAULT_MAIN_COLOR = '#4c97ff',
        DEFAULT_SECOND_COLOR = '#82d900';

    if (location.search === '?NoUserscript') return;

    window.aerfayingExplore = {};

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
    /**
     * @param {string} selector
     * @returns {HTMLElement[]}
     */
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
            $(item.selector)?.forEach((element) => {
                if (!item.handledElements.find(e => e == element)) {
                    item.handledElements.push(element);
                    (async () => { item.callback(element) })();
                }
            })
        })
        // addSelectorEvent
        eventElement.forEach((item) => {
            $(item.selector)?.forEach((element) => {
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
        let div = document.createElement('div');
        div.innerText = str;
        return div.innerHTML;
    };


    // 监听请求（这里用的是 jQuery 的 $）
    window.$(document).ajaxSuccess(function (event, xhr, settings, response) {
        if (settings.url.search(/WebApi\/Projects\/[0-9]+\/Get/) == 1) { // /WebApi/Projects/*/Get 获取作品信息
            projectThumbId = response?.project?.thumbId; // 在变量里保存获取到的作品封面
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
        tag: 'explore:emoji',
        text: '在评论时添加贴吧或 QQ 表情',
        select: [
            '关闭【表情】按钮',
            '使用百度贴吧表情',
            '使用 QQ 表情'
        ],
        type: 'radio',
        default: 1,
        desp: `表情图像的版权属于百度贴吧或腾讯 QQ`
    }, {
        tag: 'explore:https',
        text: '自动 HTTPS',
        type: 'check',
        default: true,
    }, {
        tag: 'explore:uploadImage',
        text: '在评论时上传图片',
        type: 'check',
        default: true,
        desp: '实验性功能，请勿滥用'
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
        desp: `自动在本地存储并索引访问过的页面，使用 Ctrl + K 快捷键可以呼出搜索栏并搜索这些页面。`
    }, {
        tag: 'explore:betterPriseAndBlame',
        text: '优化评论赞踩显示机制',
        type: 'check',
        default: false,
        desp: `在评论下方只显示点赞数减去点踩数的值，并且这个值小于等于 0 时不显示，类似 B 站评论，可以对“点踩侠”眼不见心不烦`
    }, {
        tag: 'explore:projectAssetLoad',
        text: '稳定与优化作品资源加载',
        type: 'check',
        default: false,
        desp: `自动重新加载加载失败的作品资源，并显示重新的加载进度（实验性功能）`
    }, {
        tag: 'explore:commentVisibilityPredict',
        text: '预测并提示评论发出后的仅好友可见状态',
        type: 'check',
        default: true
    }, {
        tag: 'explore:betterHomepage',
        text: '优化主页',
        type: 'check',
        default: false,
        desp: '优化了主页的样式、提供了实用功能。'
    }, {
        tag: 'explore:modalBackgroundBlur',
        text: '对话框背景虚化',
        type: 'check',
        default: true
    }
    ];

    // 欢迎
    if (localStorage['explore:commentVisibilityPredict'] == undefined) {
        let interval = setInterval(() => {
            if ($('.footer').length) {
                $('.footer')[0].style.display = 'none';
                clearInterval(interval);
            }
        });
        Blockey.Utils.confirm(`欢迎使用 Aerfaying-Explore`, `
            <b>嗨${Blockey.Utils.getLoggedInUser() ? `，${Blockey.Utils.getLoggedInUser().username}` : ''}！欢迎使用 Aerfaying-Explore 插件！</b><br/>
            - 当您看到这条消息时说明您已经成功地安装了这个插件，希望这个插件能有效地提升您的社区探索体验！<br/>
            - 大部分拓展功能默认是关闭的，您可以在 <a onclick="$('#nav-explore-setting')[0].click()">插件设置</a> 中选择启用或关闭插件功能。<br/>
        `);
    }

    // 设置默认值
    settings.forEach((item) => {
        if (!localStorage[item.tag]) {
            localStorage[item.tag] = item.default;
        }
    });

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
        // 自定义样式
        html += `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 1em 0;
            ">
                <div style="margin: 0.3em 0">
                    <b style="display: block">个性化样式</b>
                    <small>设置主题色、自定义字体、添加自定 CSS...</small>
                </div>
                <a onclick="window.openCustomStyle()">前往设置</a>
            </div>
        `;
        window.openCustomStyle = () => {
            Blockey.Utils.confirm('自定义样式', `
                <div style="
                    gap: 1em;
                    display: flex;
                    flex-direction: column;
                    margin-bottom: 1em;
                ">
                    <b>设置自定义字体</b>
                    <input type="text" class="form-control customFont" placeholder="自定义字体名称" onChange="window.setCustomStyle('font', event.target.value)">

                    <b>设置主题颜色</b>
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="
                            display: flex;
                            gap: 1em;
                        ">
                            <input type="color" id="mainColor" onchange="window.setCustomStyle('mainColor', event.target.value)">
                            <input type="color" id="secondColor" onchange="window.setCustomStyle('secondColor', event.target.value)">
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="window.setCustomStyle('defaultTheme')">恢复默认值</button>
                    </div>

                    <div>
                        <b>引入自定义 CSS 文件</b>
                        <small>添加自定义 CSS 文件前请确保您了解这个文件的内容和用途。</small>
                    </div>
                    <input type="text" class="form-control customCSSFile" placeholder="自定义 CSS 文件地址" onChange="window.setCustomStyle('cssFile', event.target.value)">

                    <div>
                        <b>自定 CSS</b>
                        <small>请确保您理解您所输入的 CSS 代码。</small>
                    </div>
                    <textarea
                        class="form-control customCSS"
                        placeholder="自定义 CSS"
                        style="resize: vertical;"
                        onChange="window.setCustomStyle('css', event.target.value)"
                    ></textarea>
                </div>
            `);
            window.setCustomStyle = function (name, value) {
                if (name == 'cssFile') {
                    localStorage['explore:customCSSFile'] = value;
                } else if (name == 'font') {
                    localStorage['explore:customFont'] = value;
                } else if (name == 'css') {
                    localStorage['explore:customCSS'] = value;
                } else if (name == 'mainColor') {
                    localStorage['explore:mainColor'] = value;
                    window.applyThemeColor();
                    $('.ok-button')[0].style.background = value;
                    $('.ok-button')[0].style.border = value;
                } else if (name == 'secondColor') {
                    localStorage['explore:secondColor'] = value;
                    window.applyThemeColor();
                } else if (name == 'defaultTheme') {
                    window.setCustomStyle('mainColor', DEFAULT_MAIN_COLOR);
                    window.setCustomStyle('secondColor', DEFAULT_SECOND_COLOR);
                    $('#mainColor')[0].value = localStorage['explore:mainColor'];
                    $('#secondColor')[0].value = localStorage['explore:secondColor'];
                }
            };
            localStorage['explore:customCSS'] && ($('.customCSS')[0].value = localStorage['explore:customCSS']);
            localStorage['explore:customCSSFile'] && ($('.customCSSFile')[0].value = localStorage['explore:customCSSFile']);
            localStorage['explore:customFont'] && ($('.customFont')[0].value = localStorage['explore:customFont']);
            $('#mainColor')[0].value = localStorage['explore:mainColor'];
            $('#secondColor')[0].value = localStorage['explore:secondColor'];
        }
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
                    <small>${window.GMAvailable ? '移动到 gitblock.cn' : '似乎不支持该功能？'}</small>
                </div>
                <select
                    style="height: 2em"
                    id="explore-redirect-selector"
                    onchange="SetRedirect(document.querySelector('#explore-redirect-selector').value)"
                    ${window.GMAvailable ? '' : 'disabled'}
                >
                    <option value="none">不自动跳转</option>
                    <option value="gitblock">自动跳转 gitblock.cn</option>
                </select>
            </div>
        `;
        // 导出和导入配置
        html += `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 1em 0;
            ">
                <div style="margin: 0.3em 0">
                    <b style="display: block">配置</b>
                </div>
                <div>
                    <a onclick="window.aerfayingExplore.importConfig()">导入</a> /
                    <a onclick="window.aerfayingExplore.exportConfig()">导出</a>
                </div>
            </div>
        `;
        window.aerfayingExplore.exportConfig = async () => {
            let exportData = {};
            settings.forEach((item) => {
                exportData[item.tag] = localStorage[item.tag];
            });
            ['explore:mainColor', 'explore:secondColor', 'explore:remark', 'explore:customCSS', 'explore:customCSSFile', 'explore:customFont'].forEach((key) => {
                if (localStorage.getItem(key)) exportData[key] = localStorage[key];
            });
            try {
                await navigator.clipboard.writeText(JSON.stringify(exportData));
                Blockey.Utils.Alerter.info('已复制到剪贴板');
            } catch (e) {
                console.log(e);
                Blockey.Utils.Alerter.info('复制到剪贴板失败');
            }
        };
        window.aerfayingExplore.importConfig = () => {
            Blockey.Utils.prompt('导入配置').then((data) => {
                try {
                    let importData = JSON.parse(data);
                    settings.forEach((item) => {
                        if (item.type === 'radio' && Number.isInteger(Number(importData[item.tag])) || item.type === 'check' && ['true', 'false'].includes(importData[item.tag])) {
                            localStorage[item.tag] = importData[item.tag];
                        } else {
                            throw Error(`${item.tag} 在类型 ${item.type} 下错误的值 ${importData[item.tag]}`)
                        }
                    });
                    ['explore:mainColor', 'explore:secondColor', 'explore:customCSS', 'explore:customCSSFile', 'explore:customFont'].forEach((key) => {
                        if (importData[key]) {
                            localStorage[key] = importData[key];
                        }
                    });
                    importData['explore:remark'] && (localStorage['explore:remark'] = JSON.stringify(JSON.parse(importData['explore:remark'])));
                    location.reload();
                } catch (e) {
                    Blockey.Utils.Alerter.info(`配置存在错误！${e}`);
                }
            });
        }
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

    // 请求作品资源（GET https://cdn.gitblock.cn/Project/GetAsset?name=）失败时自动重新加载，并显示加载进度
    if (localStorage['explore:projectAssetLoad'] == 'true') {
        const fetch_old = window.fetch;
        var projectAssetLoadLog = [];
        var projectAssetLoadCount = {
            total: 0,
            success: 0,
            failed: 0
        }
        window.fetch = (...args) => {
            if (args[0].match(/http(s)?:\/\/cdn.gitblock.cn\/Project\/GetAsset\?name=/)) {
                projectAssetLoadCount.total++;
                return new Promise((resolve, reject) => {
                    let retryCount = 0;
                    const tryFetch = async () => {
                        let response;
                        try {
                            response = await fetch_old(...args);
                        } catch (e) {
                            response = false;
                        }
                        if (response?.status === 200) { // 请求成功
                            resolve(response);
                            projectAssetLoadLog.push(`成功 ${args[0].split('=')[1]}`);
                            projectAssetLoadCount.success++;
                        } else if (retryCount <= 8) { // 请求失败，重试
                            retryCount++;
                            setTimeout(tryFetch, 1000);
                            projectAssetLoadLog.push(`重试 ${args[0].split('=')[1]}（第 ${retryCount} 次）`);
                        } else { // 请求失败次数超过 8 次放弃加载并返回占位图
                            resolve(fetch(`data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAABmSURBVDhPtYwBCsAwCAP7/093c2tEaya6sQOhDcmNk/nx7kcXJ0BQxW5UIFQke98JhEzCukEgdDIqEGyedR4FwiqsX+Rfgc2zDhV0siBgRcC6TpCNwd5XQWUM7OYSdMYAOxW8uzEPkuP1J7Jf5JYAAAAASUVORK5CYII=`));
                            projectAssetLoadCount.failed++;
                            projectAssetLoadLog.push(`失败 ${args[0].split('=')[1]}`);
                        };
                    };
                    tryFetch();
                })
            } else {
                return fetch_old(...args);
            }
        }
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
        // 如果其设置为“保持原状”或者这页是签到的嵌入页，那就直接退出
        if (localStorage['explore:loading'] == 0 || location.search === '?openRobotCheckIn' + localStorage['openRobotCheckInKey']) return;
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
            .explore-project-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
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
                // 设置作品资源加载 Log
                // console.log(projectAssetLoadLog)
                if (localStorage['explore:projectAssetLoad'] == 'true' && $('pre.explore-asset-load-log')[0] && projectAssetLoadLog?.length) {
                    $('pre.explore-asset-load-log')[0].innerText = projectAssetLoadLog[projectAssetLoadLog.length - 1] + `\n` + `共 ${projectAssetLoadCount.total} 个，完成 ${projectAssetLoadCount.success} 个`;
                }
                // 清除加载遮盖
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
                        // 作品资源加载数据重置
                        if (localStorage['explore:projectAssetLoad'] == 'true') {
                            if (projectAssetLoadCount.failed > 0) {
                                Blockey.Utils.confirm('加载错误', `共 ${projectAssetLoadCount.failed} 个资源加载错误<br/>加载日志：` + projectAssetLoadLog.map(x => encodeHTML(x)).join('<br/>'));
                            }
                            console.log('加载资源统计', projectAssetLoadCount);
                            console.log('加载日志', projectAssetLoadLog);
                            projectAssetLoadCount = { success: 0, failed: 0, total: 0 };
                            projectAssetLoadLog = [];
                        }
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
                    color: #fff;
                ">
                    <span>载入项目</span>
                </div>
                ${localStorage['explore:projectAssetLoad'] == 'true' ?
                    `<pre class="explore-asset-load-log" style="
                        max-height: 4em;
                        padding: 0;
                        background: none;
                        border: none;
                        color: #fff;
                        text-align: center;
                    "></pre>` : ''
                }
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
    if (localStorage['explore:emoji'] !== 0) {
        addFindElement('.reply-box_footer_2AkDv', (element) => {
            // 创建表情选择器元素
            let emojiSelector = document.createElement('div');
            let selectorId = (Math.random() * Math.pow(10, 8)).toFixed().toString();
            emojiSelector.classList.add('explore-emoji-selector-' + selectorId);
            emojiSelector.classList.add('explore-emoji-selector');
            emojiSelector.style.display = 'none';
            // 创建表情列表
            let emojiList = [];
            if (localStorage['explore:emoji'] == 1) for (let i = 1; i <= 50; i++) emojiList.push(`https://tb2.bdstatic.com/tb/editor/images/face/i_f${i < 10 ? `0${i}` : i}.png?t=20140803`)
            if (localStorage['explore:emoji'] == 2) {
                let qqEmojiIdList = ['C7860496100A25C248E2B49BC43BF107', 'D91C963E7A9A71B1DE4C34E7FA3E134D', '2374EC0FEBDA5B4D7FF4D4417AD30794', 'F7E3450F8116DB144736CF2D8BA40AE1', 'D6CC724B743B16E8F5669B1C8D2E1419', '79BC0204EFDA5FC8B7F58DD2919F14BA', '01F0D3052CEA6068BA78D422AF39E8F4', '4C610EC70AACD9762AC6DBB536A41594', '2D201BDBAA9EDDFBD2CD9C56C0D3DE1B', '92F54F733E9AFC4751B850C6CA8283E0', '60F28830ACD3C9F3342BB9FD08ACBB3D', 'BE3BFF1AB063D67A0BEE180DE25E5259', '26E10845729CCB1D352346D366321560', 'B9341F2551CC97EADC08DA05A729C24C', 'F381BB44F054EE263B8F352B2465FE16', 'fd1bc31195dc23d23b142d1aed152b2d', '7BDDC12E58ED7104965ACAA815C01AF8', '4EBC9B78B3EE653A6C01231CF7F88336', '70F379549AF342CDC85CE71430138E0C', 'D15CC85440F52212F7F66CCBA48DF7E1', 'F41BADB480332696C6CAE2A9BE63A727', 'F4489229AD9173DB271778B4F8550FFE', '2604155BDA603A0AF3B0562F53924E4D', '20F91BA637DF9B00346E300265C25134', '2179AB12C8B0875E50F822F34F9E8C4E', 'F169ABD2D17E1D782E07B5566FE8CBDF', 'BE332353C51111E908AD37768C84EC6A', 'C2F482CC3178644BA7559B7D81646359', 'EB572216B4A80F2ACC02050129773FA7', '2DE655373EADAEE34C537B5CBE1F7E86', '46525544D8ED7C25414445A26213935D', '73AE17624A2F287E305576EAD83FB381', '8BD6B128E35D52E35B34D2A6144F63AA', '578463708D7DE56A1C4E6331831B3E2E', 'BC762F2A3AD31450A17A2D679A6288EE', '163BD977FF7352707ACD8B4354A519D3', '9FC604A819EE3DFDC58FA5255618620B', '481A1EABD8D94C69378B7D1F79952D61', 'A1E74402D4A4047C62866F90C6D5028C', '5E4A5467C1D06467EFC6DF726EE4731F', '3CFB6F4C7F668E8898968D0FA125955D', '1EF107CB131F3DC1B61575467B71A1E5', 'EF373068892F296DFEB1FE2CDD547B31', 'D8D77510DA9AC1F3971D894A7C87544C', '9F9C4DD7976388E6406E6026FB4DDA05', '9753F3983F9CFACD000795ED69EA4E02', 'fb081776741238346b289d73476da8ce', '19131914FA8B10BF88675681F7485E66', '2B542AACE644AE2A72CF48F1B6C65AB9', '456cedab9e073e9887dbfb14a8711171', '8e506ffac01ffdfec525db16455acafb', '17DCBC5BD8C616290760679070BF4FDA']
                qqEmojiIdList.forEach(id => emojiList.push(`https://cdn.gitblock.cn/Media?name=${id}.png`));
            }
            // 创建表情元素
            emojiList.forEach((url) => {
                // 创建元素并设置 URL 和点击后在输入框添加对应 Markdown
                let emoji = document.createElement('img');
                emoji.src = url;
                emoji.addEventListener('click', (e) => {
                    let textarea = e.target.parentNode.parentNode.parentNode.parentNode.querySelector('textarea');
                    // value +=
                    textarea.value = textarea.value.slice(0, textarea.selectionStart) + `![表情](${e.target.src})` + textarea.value.slice(textarea.selectionStart);
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
            });
            element.append(emojiSelector);
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
            insertBefore(openSelector, element.querySelector('.control-group').childNodes[0]);
        })
        addStyle(`
            .reply-box_footer_2AkDv {
                position: relative;
            }
            .explore-emoji-selector {
                display: flex;
                position: absolute;
                flex-wrap: wrap;
                z-index: 1999;
                background: rgba(255, 255, 255, 0.85);
                box-shadow: 0px 0px 64px rgb(0 0 0 / 20%);
                border-radius: 8px;
                padding: 1em;
                margin-top: 0.5em;
                justify-content: center;
                backdrop-filter: blur(4px);
                transform: translateY(calc(50% + 1.5em));
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
                        <small>获取更新的数据来源以及此处的更新渠道均为 Github，因此可能无法打开链接，或者一些浏览器插件可能就不支持通过打开链接直接更新插件，如果您遇到了这些情况，请尝试 <b><a href="https://cdn.jsdelivr.net/gh/waterblock79/aerfaying-explore/aerfaying-explore.user.js">从 CDN 安装</a></b> 或重新 <a href="https://waterblock79.github.io/aerfaying-explore/#%E5%AE%89%E8%A3%85%E6%8F%92%E4%BB%B6">安装插件</a>，亦或禁用自动检查更新功能。</small>
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
        if (autoRedirect == 'aerfaying') {
            GM_setValue('explore:autoRedirect', 'none');
            Blockey.Utils.confirm('移动到 gitblock.cn', 'aerfaying.com 域名即将停用，我们不再支持自动跳转到该域名，建议您移动到 <b>gitblock.cn</b> 下继续使用社区。<style>.footer { display: none; }</style>');
        }
        if (autoRedirect == 'gitblock') {
            if (window.location.host != 'gitblock.cn') window.location.host = 'gitblock.cn';
            addFindElement('a', el => {
                const url = new URL(el.href, 'https://gitblock.cn');
                if (url.host.match(/aerfaying\.com$/g)) {
                    url.host = url.host.replace(/aerfaying\.com$/g, 'gitblock.cn');
                    el.href = url.href;
                }
            })
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

            .explore-comment-preview img {
                max-width: 100%;
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
            // console.log(messageListByForId);
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
                });
            } catch (e) { }
        }

        // 创建搜索结果HTML的函数
        const createSearchResultHTMLCode = (item) => `
            <a class="result" href="${encodeURI(item.url)}" target="_blank">
                ${item.image ?
                `<img src="https://cdn.gitblock.cn/Media?name=${encodeURI(item.image)}" />` :
                /*`<i class="mission lg" style="margin: 0 0.55em 0 0.25em; color: lightslategrey;"></i>`*/``
            }
                <div style="overflow: hidden">
                    <div style="font-size: 1.25em">${encodeHTML(item.name)}</div>
                    <div style="font-size: 0.75em; opacity: 0.75">${encodeHTML(item.url)} - 最后访问：${item.lastVisit === 0 ? '很久以前' :
                Date.now() - item.lastVisit < 24 * 60 * 60 * 1000 ? (new Date(item.lastVisit)).toLocaleTimeString().split(':').splice(0, 2).join(':') :
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
            if (e.key == 'Escape') {
                searchRootElement.style.display = 'none';
                e.preventDefault();
            }
            if ((e.ctrlKey || e.metaKey) && e.key == 'k') {
                searchRootElement.style.display = '';
                searchRootElement.querySelector('input').focus();
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
                        if (result.length > 75) {
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
        window.sandbox = {
            autoScroll: false
        }
        $('title')[0].innerHTML = `Markdown 沙盒 - Aerfaying Explore`;
        $('.container')[1].innerHTML = `
            <h4 style="margin: 0.5em 0.5em">
                Markdown 沙盒
                <p style="
                    font-size: 0.75rem;
                    line-height: 2em;
                ">
                    您可以在 Markdown 沙盒中使用 A 营的 Markdown 并实时预览。编辑会实时保存到本地存储中，请勿在这里输入隐私信息或者重要内容。
                    <br/>
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
                overflow: auto;
            }
            .sandbox-container[autoScroll='true'] {
                height: 40em;
            }
            .sandbox-container[autoScroll='true'] > div {
                height: 100%;
            }
            .sandbox-container[autoScroll='true'] > textarea {
                resize: none;
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
        if (!window.location.pathname.match(/\/Users\/[0-9]+\/My/g)) return;
        let e = document.createElement('div');
        e.className = 'sidebar-nav_nav_1dRFd sidebar-nav_on_2_HNF';
        e.innerHTML = `
            <div class="sidebar-nav_navName_2Wr6t">
                <a class="" href="/Sandbox"><i class="edit lg"></i>沙盒</a>
            </div>
        `;
        element.append(e);
    });

    // 查看全部精华选票
    addFindElement('.featured-vote-modal_body_F4hto, .featured-vote-modal_itemDetails_3rvD6', (element) => {
        const btn = document.createElement('span');
        btn.className = 'btn btn-primary btn-sm';
        btn.style.margin = '1em 0';
        btn.innerText = '查看全部投票';
        let btnAppend = setInterval(() => {
            if (element.parentNode.querySelector('tbody')) {
                element.parentNode.append(btn);
                clearInterval(btnAppend);
            }
        });
        btn.addEventListener('click', (event) => {
            fetch(`/WebApi/Projects/${Blockey.Utils.getContext().target.id}/GetEvaluates`, { "method": "POST" })
                .then(reponse => reponse.json())
                .then(data => {
                    const tbody = element.parentNode.querySelector('tbody');
                    tbody.innerHTML = `
                        <tr class="responsive-table_head_2zj6E">
                            <th class="">投票人</th>
                            <th class="">等级</th>
                            <th class="">平均分</th>
                            <th class="">投票时间</th>
                            <th class="">创意构思</th>
                            <th class="">艺术审美</th>
                            <th class="">程序思维</th>
                            <th class="">评价</th>
                        </tr>
                    `;
                    data.evaluates.forEach((vote) => {
                        const tr = document.createElement('tr');
                        tr.className = '';
                        tr.innerHTML = `
                            <td>
                                <a href="/Users/${encodeURIComponent(vote.creator.id)}" class="user-info_wrapper_2acbL">
                                    <img
                                        class="thumb-img_thumb_PzoKt thumb-img_thumb-border_14aaQ user-info_image_1bbCz user-info_circle_3xryU"
                                        src="https://cdn.gitblock.cn/Media?name=${encodeURIComponent(vote.creator.thumbId)}"
                                    ><span class="username">${encodeHTML(vote.creator.username)}</span>
                                </a>
                            </td>
                            <td
                                style="text-wrap: nowrap"
                            >
                                ${['', '初级', '中级', '高级', '史诗级', '传说级'][vote.level] + '精华'}
                            </td>
                            <td>${((vote.scoreArts + vote.scoreCreative + vote.scoreProgram) / 3).toFixed(1)}</td>
                            <td
                                style="text-wrap: nowrap"
                            >
                                ${Blockey.Utils.formatDateString(new Date(vote.createTime), 'yyyy-MM-dd')}
                            </td>
                            <td>${Number(vote.scoreCreative)}</td>
                            <td>${Number(vote.scoreArts)}</td>
                            <td>${Number(vote.scoreProgram)}</td>
                            <td>${encodeHTML(vote.descp.replaceAll('\n', ' '))}</td>
                        `;
                        tbody.append(tr);
                    });
                    btn.remove();
                })
        });
    });

    addFindElement('span.modal_back-button_3HvWm', (element) => {
        if (location.pathname.toLowerCase().endWith('editor')) return;
        element.className = 'btn btn-primary';
    });

    // 提示评论可能被设为仅好友可见
    if (localStorage['explore:commentVisibilityPredict'] == 'true') {
        let currentFriendVisibleOnlyStatus = 0;
        // 尚未获取到好友状态时设置状态为 -1
        addHrefChangeEvent(() => {
            currentFriendVisibleOnlyStatus = -1
        });
        // 设置提示
        addFindElement('.reply-box_footer_2AkDv > span', (element) => {
            let wait = setInterval(() => {
                if (currentFriendVisibleOnlyStatus >= 0) {
                    if (currentFriendVisibleOnlyStatus == 1) {
                        const alert = document.createElement('span');
                        alert.style.opacity = 0.5;
                        alert.style.margin = '0 0.5em';
                        alert.style.userSelect = 'none';
                        alert.innerText = '[仅好友可见]';
                        alert.addEventListener('click', () => {
                            Blockey.Utils.confirm('这个评论可能被设为“仅好友可见”状态',
                                `
                                2022 年 8 月社区推出“<b>仅好友可见</b>”功能，测试表明：<br/>
                                <div style="
                                    margin: 0.75em 1em;
                                    line-height: 1.5em;
                                ">
                                    1. 如果发布评论的用户不是评论区的所有者或者其好友，那么评论会被默认设定为“仅好友可见”状态，需要评论区所有者手动在评论右上角点击“公开”使该评论对所有人都可见。<br/>
                                    2. 只有评论区的所有者或其好友才可以看到“仅好友可见”状态的评论。<br/>
                                    3. 助手机器人会影响评论的可见性。当评论区被助手机器人设为“仅好友可评论”时，即使评论的发布者是评论区所有者的好友，评论也会被自动设为“仅好友可见”状态；当“禁止评论”时，除了评论区所有者外的所有用户都无法查看“仅好友可见”的评论（即使是所有者的好友）。<br/>
                                    参考资料：<a href="/Studios/24291/Forum/PostView?postId=35421">阿儿法营/稽木世界用户入门指南 - 论坛</a>
                                </div>
                                根据以上规则，<b>我们预测该评论发出后将会处于“仅好友可见”状态</b>。
                            `
                            );
                        })
                        element.append(alert);
                    }
                    clearInterval(wait);
                }
            }, 100);
        });
        // 获取好友状态
        addFindElement('.comment-panel_comment-panel_3pBsc', () => {
            if (['User', 'ForumPost', 'Project'].includes(Blockey.Utils.getContext().targetType)) {
                const creatorId = Blockey.Utils.getContext().target.creatorId || Blockey.Utils.getContext().target.id;
                const myId = Blockey.Utils.getContext().loggedInUser.id;
                // 自己在自己的评论区评论不会仅好友可见
                if (creatorId == myId) {
                    currentFriendVisibleOnlyStatus = 0;
                    return;
                }
                // 助手机器人会影响评论的可见性。当评论区被助手机器人设为“仅好友可评论”时，即使评论的发布者是评论区所有者的好友，评论也会被自动设为“仅好友可见”状态；当“禁止评论”时，除了评论区所有者外的所有用户都无法查看“仅好友可见”的评论（即使是所有者的好友）。
                if (Blockey.Utils.getContext().target.commentOpenLevel && Blockey.Utils.getContext().target.commentOpenLevel < 2) {
                    currentFriendVisibleOnlyStatus = 1;
                    return;
                }
                // 获取与评论区所有者的好友状态
                fetch(`/WebApi/Users/${myId}/GetPagedUserFollowers`, {
                    "headers": {
                        "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                    },
                    "referrer": `https://gitblock.cn/Users/${myId}/My/FollowedUsers`,
                    "body": `type=Followed&usernameOrId=#${creatorId}&order=createTime&pageSize=24&pageIndex=1`,
                    "method": "POST",
                })
                    .then(res => res.json())
                    .then(data => {
                        const result = data.pagedUserFollowers.items.filter(user => user.isBidirectional);
                        if (!result.length) currentFriendVisibleOnlyStatus = 1; // 仅好友可见
                        else currentFriendVisibleOnlyStatus = 0; // 非仅好友可见
                    })
                    .catch(() => {
                        Blockey.Utils.Alerter.info('“仅好友可见”预测失败');
                        currentFriendVisibleOnlyStatus = 0; // 预测失败
                    });
            }
        });
    }

    // 增添从新闻公告打开原帖的能力
    addFindElement('.panel2_panelHead_1Bn6y', (element) => {
        if (location.href.match(/\/Posts\/([0-9]+)\/View\/?/g)) {
            const a = document.createElement('a');
            a.href = `/Studios/${Blockey.Utils.getContext().target.studioId}/Forum/PostView?postId=${Blockey.Utils.getContext().target.id}`;
            a.className = 'btn btn-primary';
            a.innerText = '前往原帖';
            element.append(a);
        }
    });

    // 主页优化
    if (localStorage['explore:betterHomepage'] == 'true') {
        addHrefChangeEvent(() => {
            addStyle(`
                #carousel-banner { opacity: 0;  }
                .home_bgColor_Ffb4T, .home_bgUndefpainting_1oUZ1 .container > div:first-child { background-image: none !important; }
                .home_bgColor_Ffb4T i.project-featured { color: #4c97ff }
                .home_padding_2Bomd i.project-hot { color: indianred }
            `);
        })
        addFindElement(`#carousel-banner`, () => {
            // 替换轮播
            $('#carousel-banner')[0].innerHTML = `
                <div class="card_wrapper_2Sod3 project-card_wrapper_nRmEY card_vertical_1XmvA new-home-carousel">
                    <div style="
                        position: absolute;
                        left: 0;
                        bottom: 0;
                        padding: 1.5em;
                    ">
                        <div style="
                            font-size: 1.5em;
                            font-weight: 600;
                        ">欢迎回到${Blockey.DOMAIN.name == 'gitblock.cn' ? '稽木世界' : '阿儿法营'}！</div>
                        <div>现在是 <span class="new-home-time">2024-03-02 22:20</span></div>
                    </div>
                </div>
                <div class="card_wrapper_2Sod3 project-card_wrapper_nRmEY card_vertical_1XmvA new-home-console">
                    <a class="username"></a>
                    <a class="btn btn-primary ${!Blockey?.INIT_DATA?.loggedInUser ? 'disabled' : ''} new-home-checkInBtn" onclick="window.openRobotCheckIn()">签到</a>
                </div>
            `;
            addStyle(`
                #carousel-banner {
                    padding-top: 2em;
                    display: flex;
                    gap: 1em;
                    opacity: 1 !important;
                }
                @media screen and (max-width: 768px) {
                    #carousel-banner {
                        padding: 0 1em;
                        padding-top: 2em;
                    }
                }
                .new-home-carousel {
                    width: 100%;
                    background: url(https://cdn.gitblock.cn/Media?name=1ED99762F0EBB6B482B5F0BB4A20564E.png);
                    background-position: center;
                    background-size: contain;
                }
                .new-home-console {
                    padding: 2em;
                    display: flex;
                    flex-direction: column;
                    gap: 0.2em;
                    align-items: center;
                    height: 10em;
                    justify-content: space-between;
                    min-width: 10em;
                }
                @media screen and (max-width: 480px) {
                    .new-home-carousel {
                        display: none;
                    }
                    .new-home-console {
                        width: 100%;
                        margin: 0 1em;
                    }
                }
                .new-home-console .username {
                    font-size: 1.5em;
                    font-weight: 600;
                    text-wrap: nowrap;
                    margin-bottom: 0.5em;
                    line-height: 1em;
                    color: #000;
                    text-decoration: none;
                }
                .new-home-console .btn {
                    width: 100%;
                }
                .new-home-console .date {
                    text-wrap: nowrap;
                    line-height: 1em;
                    margin-top: 0.5em;
                    font-size: 0.9em;
                    opacity: 0.5;
                }
                .new-home-carousel[time="night"] {
                    color: #fff;
                    background: linear-gradient(#1a237ecc, #283593cc);
                }
                .new-home-carousel[time="sunrise_sunset"] {
                    color: #000;
                    background: linear-gradient(#fff3e080, #ffe0b280);
                }
                .new-home-carousel[time="day"] {
                    color: #000;
                    background: linear-gradient(#bbdefb60, #e3f2fd80);
                }
                .new-home-time {
                    font-weight: 600;
                }
            `);
            // 设置 carousel 颜色
            let hours = new Date().getHours() + new Date().getMinutes() / 60,
                months = new Date().getMonth() + new Date().getDate() / 31;
            let sunset = ((x) => 1.75 * Math.sin(0.4 * x - 1.06) + 18.1)(months),
                sunrise = ((x) => -1.9 * Math.sin(0.4 * x - 1.07) + 6.6)(months);
            let time;
            if (hours < sunrise - 0.25 || hours > sunset + 0.25) time = "night";
            else if (hours > sunrise + 1 && hours < sunset - 1) time = "day";
            else time = "sunrise_sunset";
            $('.new-home-carousel')[0].setAttribute('time', time);
            // 设置信息显示
            // 显示时间
            $('.new-home-time')[0].innerText = Blockey.Utils.formatDate(new Date());
            setInterval(() => {
                if ($('.new-home-time').length) $('.new-home-time')[0].innerText = Blockey.Utils.formatDate(new Date());
            }, 500);
            // 显示登陆状态
            $('.new-home-console .username')[0].innerText = Blockey.INIT_DATA?.loggedInUser?.username || '未登录';
            let interval = setInterval(() => {
                if ($('.new-home-console .username').length && $('.new-home-checkInBtn').length) {
                    if (Blockey.Utils.getLoggedInUser() && $('.new-home-checkInBtn')[0].classList.contains('disabled')) {
                        // 设置登陆状态
                        $('.new-home-console .username')[0].innerText = Blockey.Utils.getLoggedInUser()?.username || '未登录';
                        Blockey.Utils.getLoggedInUser() && ($('.new-home-console .username')[0].href = '/Users/' + Blockey.Utils.getLoggedInUser().id);
                        // 设置签到按钮禁用与否
                        $('.new-home-checkInBtn')[0].classList.remove(['disabled']);
                        clearInterval(interval);
                    }
                }
            }, 200);
        });

        // 实现内嵌签到页面
        window.openRobotCheckIn = () => {
            // 为避免潜在的风险，打开内嵌签到页面需要动态生成的 Key
            localStorage['openRobotCheckInKey'] = Math.random();
            // 实现签到 modal
            Blockey.Utils.confirm('签到');
            let interval = setInterval(() => {
                if ($('.body.box_box_tWy-0').length) {
                    // 清空 confirm 内原来的内容
                    $('.body.box_box_tWy-0')[0].innerHTML = '';
                    $('.body.box_box_tWy-0')[0].style.padding = '0';
                    // 嵌入 iframe
                    const iframe = document.createElement('iframe');
                    iframe.style.width = '100%';
                    iframe.style.height = '30em';
                    iframe.src = `/Users/${Blockey.Utils.getLoggedInUser().id}/My/Items?openRobotCheckIn` + localStorage['openRobotCheckInKey'];
                    $('.body.box_box_tWy-0')[0].append(iframe);
                    clearInterval(interval);
                }
            });
        }

        // 实现签到组件
        if (location.search === '?openRobotCheckIn' + localStorage['openRobotCheckInKey']) {
            // 隐藏滚动条、并在加载完毕前隐身所有内容
            addStyle(`
                *::-webkit-scrollbar {
                    display: none; /* Chrome Safari */
                }
                * {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                body.invisible * {
                    opacity: 1;
                }
            `);
            document.body.classList.add('invisible');
            // 似乎有懒加载，这里滚动到最底下以使得签到机器人的按钮能被加载出来
            window.scroll(0, 10000);
            // 寻找签到机器人按钮并点击
            addFindElement('.bag-item-card_wrapper_OhZLu img[src="https://cdn.gitblock.cn/Media?name=36C146F13109C252144317DFF64AABAE.svg"]', (t) => {
                // 使内容重新可见
                document.body.classList.remove(['invisible']);
                // 全屏签到组件 CSS
                addStyle(`
                    .body.box_box_tWy-0 {
                        position: fixed;
                        left: 0;
                        top: 0;
                        height: 100%;
                        width: 100%;
                        max-height: 100% !important;
                        z-index: 100;
                        padding: 2em !important;
                    }
                `);
                t.click();
            });
            // 在新标签页中打开（谜题）链接
            addFindElement('a', a => a.target = '_blank');
        }
    };

    // 在签到机器人处提醒用户可以完成“键盘超人之ABC”任务获得额外的奖励
    addFindElement(`.robot-checkin-modal_card_25wO8`, (element) => {
        // 创建提示并把提示加入页面
        const ul = element.parentNode.querySelector('.tips_tips_BetGP > ul');
        const tip = document.createElement('li');
        tip.innerHTML = `每天完成 <a href="/Missions/20306/View">键盘超人之ABC</a> 任务还能获得最多 32 金币和 8 经验喔！`;
        ul.append(tip);
        // 切换提示
        const showNewTip = () => {
            ul.children.item(0).style.display = 'none';
            tip.style.display = 'list-item';
            localStorage['explore:checkInTips'] = 'new';
        };
        const showOldTips = () => {
            tip.style.display = 'none';
            ul.children.item(0).style.display = 'list-item';
            localStorage['explore:checkInTips'] = 'old';
        }
        (localStorage['explore:checkInTips'] != 'old') ? showNewTip() : showOldTips();
        ul.children.item(0).addEventListener('click', showNewTip);
        tip.addEventListener('click', event => { event.target == tip && showOldTips() });
    })

    // 设置默认主题色
    if (!localStorage['explore:mainColor']) localStorage['explore:mainColor'] = DEFAULT_MAIN_COLOR;
    if (!localStorage['explore:secondColor']) localStorage['explore:secondColor'] = DEFAULT_SECOND_COLOR;
    // 应用主题色函数
    window.applyThemeColor = () => {
        // mainColor: "#008080", mainColorRGBValue: "0, 128, 128", mainColorRGB: "rgb(0, 128, 128, 1)"
        // 主颜色（原来是蓝色）
        const mainColor = () => localStorage['explore:mainColor'],
            mainColorRGBValue = (lightness = 1) => `${Number.parseInt(mainColor().slice(1, 3), 16) * lightness}, ${Number.parseInt(mainColor().slice(3, 5), 16) * lightness}, ${Number.parseInt(mainColor().slice(5, 7), 16) * lightness}`,
            mainColorRGB = (lightness = 1, alpha = 1) => `rgb(${mainColorRGBValue(lightness)}, ${alpha})`;
        // 副颜色（原来是绿色）
        const secondColor = () => localStorage['explore:secondColor'],
            secondColorRGBValue = (lightness = 1) => `${Number.parseInt(secondColor().slice(1, 3), 16) * lightness}, ${Number.parseInt(secondColor().slice(3, 5), 16) * lightness}, ${Number.parseInt(secondColor().slice(5, 7), 16) * lightness}`;
        if (
            !(mainColor().match(/#[0-9A-Fa-f]{6}/g)) || mainColor().length != 7 ||
            !(secondColor().match(/#[0-9A-Fa-f]{6}/g)) || secondColor().length != 7
        ) {
            console.log('主题色设置错误！');
            return;
        }
        // 应用样式替换颜色
        addStyle(`
            .btn.btn-primary, .panel2_border_2Slyp, .pagination > .active > a, .pagination > .active > span, .pagination > .active > a:hover, .pagination > .active > span:hover, .pagination > .active > a:focus, .pagination > .active > span:focus {
                background: ${mainColor()} !important;
                border: 1px solid ${mainColor()} !important;
            }
            .btn.btn-submit, .progress_progress_Gm5t- {
                background: ${secondColor()} !important;
                border: 1px solid ${secondColor()} !important;
            }
            .form-control:focus {
                border: 1px solid ${mainColor()} !important;
                box-shadow: 0 0 0 3px ${mainColorRGB(1, 0.4)};
            }
            .btn-outline-primary {
                border-color: ${mainColor()} !important;
                color: ${mainColor()} !important;
            }
            .btn-outline-primary:hover {
                background-color: ${mainColor()} !important;
                color: #fff !important;
            }
            .modal_modal-overlay_2_Dgx {
                background-color: ${mainColorRGB(1, 0.9)} !important;
            }
            .modal_header_1dNxf {
                background-color: ${mainColorRGB()} !important;
            }
            a, a:hover, a:active, a:focus, a.black:hover, a.black:active, .pagination>li>a:focus, .pagination>li>a:hover, .pagination>li>span:focus, .pagination>li>span:hover {
                color: ${mainColorRGB(1.2)};
            }
            .color-primary, .btn-transparent:hover, .pagination > li > a, .pagination > li > span {
                color: ${mainColor()};
            }
            .stat-graph_day-1_3GeeK {
                background-color: ${mainColorRGB(1.1, 0.4)} !important;
            }
            .stat-graph_day-2_WowYZ {
                background-color: ${mainColorRGB(0.8, 0.6)} !important;
            }
            .stat-graph_day-3_36etr {
                background-color: ${mainColorRGB(0.4, 0.8)} !important;
            }
            .stat-graph_day-4_3XS42 {
                background-color: ${mainColorRGB(0.1, 1)} !important;
            }
            .new-home-carousel {
                background: ${mainColor()} !important;
                color: #fff !important;
            }
        `);
        // 替换 style 中的颜色
        addFindElement('style', styles => {
            const colorReplace = [
                ['#4c97ff', mainColor()],
                ['#4d97ff', mainColorRGB(1.05)],
                ['#4280d9', mainColorRGB(0.85)],
                ['#4f82d3', mainColor()],
                ['76,151,255', mainColorRGBValue()],
                ['76, 151, 255', mainColorRGBValue()],
                ['77,151,255', mainColorRGBValue()],
                ['77, 151, 255', mainColorRGBValue()],
                ['#70ba00', secondColor(0.8)],
                ['137,203,36', secondColorRGBValue()],
                ['#e5f0ff', mainColorRGB(1, 0.1)]
            ];
            let styleText = styles.innerHTML;
            // 跳过 scratch-blocks 样式
            if (styleText.includes('.sb-obsolete') || styleText.includes('.sb3-events')) return;
            colorReplace.forEach(color => {
                styleText = styleText.replaceAll(color[0], color[1]);
            });
            styles.innerHTML = styleText;
        });
    };
    // 应用自定义主题色
    if (localStorage['explore:customThemeColor'] && localStorage['explore:customThemeColor'] != 'true') {
        localStorage['explore:mainColor'] = DEFAULT_MAIN_COLOR;
        localStorage['explore:secondColor'] = DEFAULT_SECOND_COLOR;
        localStorage.removeItem('explore:customThemeColor');
    }
    (localStorage['explore:mainColor'] != DEFAULT_MAIN_COLOR || localStorage['explore:secondColor'] != DEFAULT_SECOND_COLOR) && applyThemeColor();

    // 查看活跃度等级值
    addFindElement(`.stat-graph_day-0_idJxi`, e => e.title = '等级 0 / 4');
    addFindElement(`.stat-graph_day-1_3GeeK`, e => e.title = '等级 1 / 4');
    addFindElement(`.stat-graph_day-2_WowYZ`, e => e.title = '等级 2 / 4');
    addFindElement(`.stat-graph_day-3_36etr`, e => e.title = '等级 3 / 4');
    addFindElement(`.stat-graph_day-4_3XS42`, e => e.title = '等级 4 / 4');

    // Modal 背景模糊
    (localStorage['explore:modalBackgroundBlur'] == 'true') && addStyle(`
        .ReactModal__Overlay {
            backdrop-filter: blur(6px);
        }
    `);

    // 处理自定义样式
    if (localStorage['explore:customCSSFile']) {
        let customCSSFileElement = document.createElement('link');
        customCSSFileElement.rel = 'stylesheet';
        customCSSFileElement.href = localStorage['explore:customCSSFile'];
        document.head.append(customCSSFileElement);
    }
    if (localStorage['explore:customCSS']) {
        addStyle(localStorage['explore:customCSS']);
    }
    if (localStorage['explore:customFont']) {
        addStyle(`
            html, body, div, h1, h2, h3, h4, h5, h6, p, pre, blockquote, address, img, dl, dt, dd, ol, ul, li, table, caption, tbody, tfoot, thead, tr, th, td, form, fieldset, legend, object, embed, * {
                font-family: ${encodeHTML(localStorage['explore:customFont'])}, arial, sans-serif;
            }
        `);
    }

    // 移动端评论区上传图片
    if (localStorage['explore:uploadImage'] == 'true') {
        addFindElement('.reply-box_footer_2AkDv', (element) => {
            // 插入按钮
            element.querySelector('.control-group').childNodes[0].insertAdjacentHTML('beforebegin', `<span class="btn btn-sm" id="explore-insert-image">图片</span>`);
            element.querySelector('#explore-insert-image').addEventListener('click', () => {
                const fileSelector = document.createElement('input');
                fileSelector.type = 'file';
                fileSelector.accept = 'image/*';
                fileSelector.addEventListener('input', (e) => {
                    let reader = new FileReader();
                    reader.readAsDataURL(fileSelector.files[0]);
                    reader.onload = () => {
                        Blockey.Utils.ajax({url: '/WebApi/Common/UploadImage', data: {dataUrl: reader.result}, success: (data) => {
                            let textarea = element.parentNode.querySelector('textarea');
                            textarea.value = textarea.value.slice(0, textarea.selectionStart) + `![](${data.imgUrl})` + textarea.value.slice(textarea.selectionStart);
                            textarea.focus();
                            let evt = new Event('change');
                            textarea.dispatchEvent(evt);
                            let eventHandlerKey = Object.keys(textarea).find((item) => item.includes('_reactEventHandlers'));
                            let eventHandler = textarea[eventHandlerKey];
                            eventHandler.onChange(evt);
                        }});
                    }
                });
                fileSelector.click();
            });
        });
    }
    // Your code here...
})();

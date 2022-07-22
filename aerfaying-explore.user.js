// ==UserScript==
// @name         Aerfaying Explore - 阿儿法营/稽木世界社区优化插件
// @namespace    waterblock79.github.io
// @version      1.1.0
// @description  提供优化、补丁及小功能提升社区内的探索效率和用户体验
// @author       waterblock79
// @match        http://gitblock.cn/*
// @match        https://gitblock.cn/*
// @match        http://aerfaying.com/*
// @match        https://aerfaying.com/*
// @match        http://3eworld.cn/*
// @match        https://3eworld.cn/*
// @icon         https://gitblock.cn/Content/logo.ico
// @grant        none
// @license      MIT
// ==/UserScript==
/*
   aerfaying-explore 是一个非官方的、针对阿儿法营/稽木世界社区的开源优化插件
   https://github.com/waterblock79/aerfaying-explore
*/

(function () {
    'use strict';
    //  $(selector)
    //  即 document.querySelectorAll(selector)
    const $ = (selector) => document.querySelectorAll(selector);


    //  addSelectorEvent(selector, event, callback)
    //  为全部符合 selector 选择器的元素自动添加 event 事件，若该事件被触发就会执行 callback 回调
    let eventElement = [];
    const addSelectorEvent = (selector, event, callback) => {
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
    };
    window.addFindElement = addFindElement;


    //  →_→
    //  通过 setInterval 实现 addFindElement 和 addSelectorEvent。
    setInterval(() => {
        // addFindElement
        findElement.forEach((item) => {
            $(item.selector).forEach((element) => {
                if (!item.handledElements.find(e => e == element)) {
                    item.callback(element);
                    item.handledElements.push(element);
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
    console.log(
        '%cAerfaying-Explore %c\n本插件开源于 Github:\nhttps://github.com/waterblock79/aerfaying-explore/',
        'font-size: 1.5em; color: dodgerblue;',
        'font-size: 1em; color: black;'
    );


    //  插件设置
    let settingsPage = [
        {
            title: true,
            text: '主要功能'
        }, {
            tag: 'explore:loading',
            text: '全屏蓝色加载遮盖设置',
            select: [
                '保持原状',
                '在导航栏显示“加载中”的文字和动画（最小）',
                '以在左下角显示不影响浏览的加载中提示替代之（经典）'
            ],
            type: 'radio',
            default: 1,
            img: '//asset.gitblock.cn/Media?name=a744eb6ea5b2336abbfd73b05ec09c32.svg'
        }, {
            title: true,
            text: '小功能'
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
        }
    ];
    // 设置默认值
    settingsPage.forEach((item) => {
        if (!localStorage[item.tag] && !item.title) {
            localStorage[item.tag] = item.default;
        }
    })
    // 创建设置摁钮
    let settingsButton = document.createElement('li');
    settingsButton.innerHTML = '<a id="nav-explore-setting"><span>插件设置</span></a>';
    addStyle(`
        .explore-settings-label {
            font-size: unset;
            margin-bottom: auto;
            line-height: unset;
            display: inline;
            font-weight: unset;
        }
    `)
    settingsButton.addEventListener('click', () => {
        let html = '';
        // 每项的设置
        settingsPage.forEach((item) => {
            // 如果是一个标题
            if (item.title) {
                html += `
                    <div style="margin: .3em 0;">
                        <b>${item.text}</b>
                    </div>
                `;
                return;
            }
            html += `
                <div style="margin: 0 .5em;">
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
                        style="margin-right: .05em;"
                    />
                `;
            }
            // 设置名称，如果是 check 类型的设置项，就用 span 包裹，否则就用 b 包裹
            html += `
                <span>
                    ${item.text}
                </span>
            `;
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
                            id="${index}"
                            ${index == localStorage[item.tag] ? 'checked' : ''}
                            onchange="localStorage['${item.tag}'] = ${index}"
                        />
                        <label
                            class="explore-settings-label"
                            for="${index}"
                        >
                            ${selectItem}
                        </label>
                        <br/>
                    `;
                });
                html += `</div>`;
            }
            // 设置图片
            if (item.img) {
                html += `<img style="margin-left: 1em; margin-top: 0.5em; border-radius: 5px;" width="90%" src="${item.img}"/>`;
            }
            html += '</div>';
        });
        // 设置的尾部显示开源地址
        html += `<hr/>`;
        html += `<a href="https://github.com/waterblock79/aerfaying-explore" style="display:block;font-weight:bold;text-align:center;"> 开源于 waterblock79/aerfaying-explore </a>`;
        html += `<br/>`;
        // 显示提示框
        Blockey.Utils.confirm('插件设置', html);
        // 移除掉“确定”按钮左边的“取消”按钮，并把“确定”摁钮中的文字替换为“关闭”
        $('button.ok-button')[0].parentNode.childNodes[0].remove();
        $('button.ok-button')[0].innerHTML = '关闭';
        $('button.ok-button')[0].addEventListener('click', () => { location.reload(); });
    })
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
                width: 1em;
                height: 1em;
                display: inline-block;
                animation: spin 2s linear infinite;
            }
            .explore-loading-text {
                margin: 0 1.25em 0 0.3em;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            /* 顶部通知图标稍微有一点歪，和这个加载提示在一起有点难看，要修正下 */
            i.notification {
                margin-bottom: 3px;
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

    // 在用户主页显示被邀请的信息
    if (location.pathname.match(/\/Users\/(\w+\/?)/g) != null) { // 若链接匹配 /Users/NUMBER/ 或 /Users/NUMBER
        window.$.ajax({
            method: 'POST',
            url: `/WebApi/Users/${location.href.match(/[0-9]+/)}/GetPagedInvitedUsers`,
            data: {
                pageIndex: 1, pageSize: 10
            },
            success: (data) => {
                let length = data.invitorPath.length;
                // 如果这个人是被邀请的，那就在在“xxxx-xx-xx加入”后面加上邀请信息
                addFindElement('.profile-head_join_HPHzg>small', (element) => {
                    element.innerHTML +=
                        length == 1 ? '' :
                            ` · 由<a href="/Users/${data.invitorPath[length - 2].id}">${encodeHTML(data.invitorPath[length - 2].username)}</a>邀请`;
                })
            }
        })
    }

    // @在用户主页的关注、粉丝下面添加一个“邀请”（该用户邀请的人）的入口
    if (location.pathname.match(/\/Users\/(\w+\/?)/g) != null) { // 同上
        addFindElement('div.grid-2fr1.grid-gap-xl', (element) => {
            // 生成查看该用户邀请过的用户的链接
            let targetUrl = location.pathname;
            if (targetUrl.slice(-1) == '/') targetUrl = targetUrl.slice(0, -1);
            targetUrl += '/My/InvitedUsers'
            // 找到“关注”、“粉丝”的父级元素
            let parent = element.childNodes[1];
            // 生成“邀请”栏的元素
            let newElement = document.createElement('div');
            newElement.className = 'panel2_wrapper_3UZFE panel-border-bottom';
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
        });
    }

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
        newElement.innerHTML = `#${element.id}`;
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
        // 在评论时间的右边、IP属地的左边插入评论 ID
        insertBefore(newElement, element.querySelector('.comment_ipregion_11bpP'));
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
            window.Blockey.Utils.prompt('更新给 TA 的备注')
                .then((data) => {
                    let remark = JSON.parse(localStorage['explore:remark']);
                    remark[Blockey.Utils.getContext().target.id] = data == '' ? undefined : data;
                    localStorage['explore:remark'] = JSON.stringify(remark);
                    location.reload();
                })
        })
    })
    // 在所有用户名后面添加备注
    let handleUserName = (element) => {
        let remark = JSON.parse(localStorage['explore:remark']);
        let usrId = element.nodeName == 'SPAN' ? Blockey.Utils.getContext().target.id : element.href.split('/')[element.href.split('/').length - 1];
        if (usrId in remark) {
            element.innerHTML += `<small style="font-size: 50%">(${encodeHTML(remark[usrId])})</small>`;
        }
    };
    addFindElement('a.comment_name_2ZnFZ', handleUserName)
    addFindElement('a.user-info_colorLink_1PrTg', handleUserName)
    addFindElement('a.user-info_wrapper_2acbL', handleUserName)
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
    // Your code here...
})();
// ==UserScript==
// @name         高效探索 - 阿儿法营/稽木世界社区优化插件
// @namespace    https://waterblock79.github.io/
// @version      0.2.5
// @description  提供优化、补丁及小功能提升社区内的探索效率和用户体验
// @author       waterblock79
// @updateURL    https://github.com/waterblock79/aerfaying-explore/raw/main/aerfaying-explore.user.js
// @match        http://gitblock.cn/*
// @match        https://gitblock.cn/*
// @match        http://aerfaying.com/*
// @match        https://aerfaying.com/*
// @match        http://3eworld.cn/*
// @match        https://3eworld.cn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gitblock.cn
// @grant        none
// @license      MIT
// ==/UserScript==
// 使用 http* 匹配 https、http 的话，在 Userscript（iOS）上貌似会导致无效

(function() {
    const encodeHtml = Blockey.Utils.encodeHtml;
    // 关闭控制台的警告
    if( location.pathname == '/IKnow' ) {
        document.querySelector('title').innerHTML = '关闭控制台警告';
        document.querySelector('.default-img_box_3iauv').innerHTML = '<img src="https://cdn.gitblock.cn/Media?name=8A20E0147BDA1E61EB3C39FE8A16CF14.svg" width="50%" /><br/><p>已关闭控制台警告</p>';
        document.querySelector('.default-img_box_3iauv').style.textAlign = 'center';
        localStorage.setItem('explore:console_warn', 'disabled')
    }
    // 在控制台显示警告信息、插件信息
    console.log(
        '%cAerfaying-Explore %c\n本插件开源于 Github:\nhttps://github.com/waterblock79/aerfaying-explore/',
        'font-size: 2em; color: dodgerblue;',
        'font-size: 1em; color: black;'
    );
    if( localStorage.getItem('explore:console_warn') != 'disabled' ) {
        console.log(
            `%c警告\n%c为保护您的账号安全，如果您不知道您在做什么，请不要在这里输入任何内容！\n%c我理解我在做什么，并关闭提示：${location.origin}/IKnow`,
            'font-size: 2em; font-weight: bold; color: red; font-family: auto;',
            'font-size: 1.5em; color: red;',
            'font-size: 20%; color: orange;'
        );
    }
    // === 在 ajax 上挂载事件 ===
    $.ajaxSettings.xhr = function pf(){
        try{
            let xhr = new XMLHttpRequest;
            xhr.onload = e => {
                // 截取用户信息 userMap
                if(JSON.parse(e.target.response).userMap != undefined){
                    let userMap = JSON.parse(e.target.response).userMap;
                    Object.keys(userMap).forEach( key => window.userInfoCache[key] = userMap[key] )
                }
            }
            return xhr;
        }catch(e){}
    };
    // === 传入评论 ID，显示评论详尽信息 ===
    window.showCommentInfo = (id) => {
        Blockey.Utils.ajax({
            url:'/WebApi/Comment/GetPage',
            data: {
                forType: Blockey.Utils.getContext().targetType,
                forId: Blockey.Utils.getContext().target.id,
                pageIndex: 1,
                scrollToCommentId: id
            },
            success: (data) => {
                data = data.scrollToThread.id == id ? data.scrollToThread : data.replies.filter( d => { return d.id == id } )[0] ;
                let linkToComment = (location.href.includes('#') ? location.href.split('#')[0] : location.href) + '#commentId=' + id;
                Blockey.Utils.confirm(
                    "评论",
                    `<span class="glyphicon glyphicon-time"></span> <b>评论时间</b><br/> ${ ( new Date(data.createTime) ).toLocaleString() } <br/><br/>
                     <span class="glyphicon glyphicon-link"></span> <b>评论链接</b><br/> <a href="${linkToComment}">${linkToComment}</a><br/><br/>
                     <pre>${ data.content }</pre>`
                )
            }
        })
    }
    //
    // === 评论 ID 显示 & 点击显示详细信息事件 ===
    if( localStorage.getItem('explore:comment_id') == null ){
        localStorage.setItem('explore:comment_id',1)
    }
    setInterval(()=>{
        let comments = document.querySelectorAll('.comment_comment_P_hgY');
        for( let i = 0; i < comments.length; i++ ) {
            comments[i].querySelector('.comment_time_3A6Cg').innerHTML +=
                comments[i].querySelector('.comment_time_3A6Cg').innerHTML.includes('#') || localStorage.getItem('explore:comment_id') == 0 || comments[i].id == '' ?
                `` : ` <span onclick="window.showCommentInfo('${ comments[i].id }')"> #${comments[i].id} </span>`
        }
    },1000)
    //
    // === 用户信息显示 ===
    if(location.pathname.match(/\/Users\/(\w+\/?)/g) != null) { // 若链接匹配 /Users/NUMBER/ 或 /Users/NUMBER
        // 轮询等待“加入时间”的元素被创建
        let setUserInfo = setInterval ( () => {
            if(document.querySelector('.profile-head_join_HPHzg') != null) {
                // 请求用户邀请 API
                Blockey.Utils.ajax({
                    url: `/WebApi/Users/${Blockey.Utils.getContext().target.id}/GetPagedInvitedUsers`,
                    data: {
                        pageIndex: 1, pageSize: 60
                    },
                    success: (data) => {
                        let length = data.invitorPath.length;
                        // 如果这个人是被邀请的，那就在在“xxxx-xx-xx加入”后面加上邀请信息
                        document.querySelector('.profile-head_join_HPHzg').querySelector('small').innerHTML +=
                            length == 1 ? '' : ` · 由<a href="/Users/${data.invitorPath[length-2].id}">${ encodeHtml(data.invitorPath[length-2].username) }</a><span onclick="window.open('./${data.invitorPath[length-2].id}/My/InvitedUsers')">邀请</span>`;
                    }
                })
                // 清掉这个轮询
                clearInterval(setUserInfo);
            }
        }, 200);
    }
    //
    // === 修复作品“继续加载”的预览图尺寸问题 ===
    let fixProjectImage = setInterval ( () => {
        if(document.querySelector('.img-responsive') != null) {
            document.querySelector('.img-responsive').style['width'] = '100%';
            clearInterval(fixProjectImage);
        }
    }, 200);
    //
    // === 悬停在用户名链接上展示用户卡片 ===
    if( localStorage.getItem('explore:user_box') == null ){
        localStorage.setItem('explore:user_box',1)
    }
    ;
    let style = document.createElement('style');
    style.innerHTML = '.comment_info_2Sjc0 { overflow: inherit !important } .'
    document.head.appendChild(style);
    ;
    window.userInfoCache = {};
    let userBox = setInterval ( () => {
        // 真人认证等级、用户等级所对应的 class
        let humanVerifiedClass = {
            1: "human-verified-icon_verifiedLevel-1_-X3x2",
            2: "human-verified-icon_verifiedLevel-2_1Byk3",
            3: "human-verified-icon_verifiedLevel-3_2hde9",
            4: "human-verified-icon_verifiedLevel-4_2gbJU",
            5: "human-verified-icon_verifiedLevel-5_2isZE",
        },
            levelClass = (level) => {
                let classList = {
                    "level-0": "user-level_level-0_3HviE",
                    "level-1": "user-level_level-1_uTxh6",
                    "level-2": "user-level_level-2_3b_PK",
                    "level-3": "user-level_level-3_1Rr5c",
                    "level-4": "user-level_level-4_18jcT",
                };
                if(0<level&&level<10){ return classList["level-0"]; }
                if(10<=level&&level<20){ return classList["level-1"]; }
                if(20<=level&&level<30){ return classList["level-2"]; }
                if(30<=level&&level<40){ return classList["level-3"]; }
                if(50<=level&&level<60){ return classList["level-4"]; }
                return classList.level-0;
            },
            adminBadge = {
                1: "239,239,237",
                2: "198,218,47",
                3: "105,197,233",
                4: "196,75,239",
                5: "237,185,54"
            };
        // 给每个评论的用户名加上一个“碰到鼠标”的事件：
        document.querySelectorAll('a.comment_name_2ZnFZ').forEach( data => data.onmouseenter = (e)=>{
            if( e.target.classList.contains('inBox') ) return;
            // 有时候加载比较满慢会同时出现俩用户框，于是我觉得可以让在创建新用户框的时候先检测一下，清除掉不是属于自己的、多余的用户框
            document.querySelectorAll('.user_box').forEach( d => { if (data.id != d.id ) { d.remove() } } )
            // 传入数据，在该用户名下生成一个用户简讯框
            let addUserBox = (data, commentId) => {
                let dom = document.createElement('div');
                dom.style = 'z-index: 5000;position: absolute;width: 75%;height: 7.5em;border: 1px #4c97ff solid;border-radius: 3px;background: white;display: flex;align-items: center;';
                dom.classList.add('user_box');
                dom.id = commentId;
                // 如果传入的用户数据在 data.user 下，那就把这个数据再塞到 data 下
                data = data.user != undefined ? data.user : data;
                dom.innerHTML = `
                   ${ data.adminLevel > 0 && localStorage.getItem('explore:show-admin-badge') != 'disabled' ?
                    `<div style="width: 18px; position: absolute; left: 5em; top: 5em; width: 1em; height: 1em; border-radius: 100%; background: rgb(${adminBadge[data.adminLevel]})"></div>` : ``
                   }
                   <img src="https://cdn.gitblock.cn/Media?name=${ data.thumbId }" style="width: 5em;margin-left: 1em;margin-right: 1em;border: solid 1px rgb(241,241,241);border-radius: 50%;">
                   <div>
                      <a href="/Users/${data.id}" class="comment_name_2ZnFZ inBox" target="_blank" style="display: block; vertical-align: sub;">
                         ${ encodeHtml(data.username) }
                      </a>
                      <i class="small human-verified ${ humanVerifiedClass[data.humanVerifiedLevel] }" style="font-size: 125%;${ data.humanVerifiedLevel == 0 ? 'display: none' : '' }"></i>
                      <small class="user-level_level_3d3fz ${levelClass(data.level)}" style="margin-right: 0.5em;">Lv.${data.level}</small>
                      <span style="color: #888;font-size: 12px;">${data.goldCoins} 金币 </span>
                      <span style="display: block;color: #888;font-size: 13px;margin-top: 2px;">${new Date(data.createTime).toLocaleDateString().replaceAll('/','-')} 加入</span>
                   </div>
                `;
                e.target.parentNode.appendChild(dom);
                //console.log(data)
            };
            // 从用户名的链接提取用户 ID
            let userId = Number(e.target.href.match(/[0-9]+/g)[0]);
            // 如果这个用户的信息没被存下，那就发送请求获取数据
            if( window.userInfoCache[userId] == undefined ) {
                let cId = data.parentElement.parentElement.id; // 请求里面的 data 给代表这个链接元素的外面的 data 覆盖掉了......
                $.ajax({ url: `/WebApi/Users/${e.target.href.match(/[0-9]+/g)[0]}/Get`, method: 'post', success: (data) => {
                    addUserBox( data, cId );
                    // 存好这个用户的数据，下回就不再请求了
                    window.userInfoCache[userId] = data;
                } });
            } else {
                addUserBox( window.userInfoCache[userId], data.parentElement.parentElement.id )
            }
        } )
        // 给每个评论的用户名加上“鼠标离开”的事件
        document.querySelectorAll('a.comment_name_2ZnFZ').forEach( data => data.onmouseleave = data.classList.contains('inBox') ? null : ()=>{ document.querySelectorAll('.user_box').forEach( d => d.remove() ) } );
    }, 300);
    // 若未开启用户简讯框功能，那就清除掉这个轮询
    if( localStorage.getItem('explore:user_box') == 0 ) {
        clearInterval(userBox);
    }
    //
    // === 在菜单中插入插件设置 ===
    // 植入开启插件设置的函数
    window.openSetting = () => {
        Blockey.Utils.confirm('插件设置',`
        <b>主要功能</b><br/>
           <div style="margin-left: 0.8em; margin-top: 0.2em; margin-bottom: 1em;\">
              <input type="checkbox" name="userBox"
                 ${ localStorage.getItem('explore:user_box') == 1 ? 'checked' : '' }
                 onchange="
                    localStorage.setItem('explore:user_box', Number( localStorage.getItem('explore:user_box') ) == 1 ? 0 : 1 );
                    Blockey.Utils.Alerter.info('刷新以应用更改');
                 "
              >
                 启用用户简讯框
              </input>
              <img src="https://asset.gitblock.cn/Media?name=d1a2079f6e5b365adef607fc1b2630bf.svg" style="margin-left: 1em" width="80%" /><br/><br/>
              全屏蓝色加载遮盖设置
              <div style="margin-left: 0.8em;">
                <input type="radio" name="loading" value="0" ${ localStorage.getItem('explore:loading') == 0 ? 'checked' : '' } onchange=" localStorage.setItem( 'explore:loading', 0 ) "/> 不改变 <br />
                <input type="radio" name="loading" value="1" ${ localStorage.getItem('explore:loading') == 1 ? 'checked' : '' } onchange=" localStorage.setItem( 'explore:loading', 1 ) "/> 以在左下角显示不影响浏览的加载中提示替代之<br />
                <input type="radio" name="loading" value="2" ${ localStorage.getItem('explore:loading') == 2 ? 'checked' : '' } onchange=" localStorage.setItem( 'explore:loading', 2 ) "/> 完全隐藏<br />
              </div>
              <img src="https://asset.gitblock.cn/Media?name=4d63b6da4cb6b5d4c2b4517540ce008c.svg" style="margin-left: 1em; margin-top: 0.5em; border-radius: 5px;" width="80%" />
              <br/><br/>
           </div>
           <b>小功能</b><br/>
           <div style="margin-left: 0.8em; margin-top: 0.2em; margin-bottom: 1em;\">
              <input type="checkbox" name="commentId"
                 ${ localStorage.getItem('explore:comment_id') == 1 ? 'checked' : '' }
                 onchange="
                    localStorage.setItem('explore:comment_id', Number( localStorage.getItem('explore:comment_id') ) == 1 ? 0 : 1 );
                    Blockey.Utils.Alerter.info('刷新以应用更改');
                 "
              >
                 启用评论 ID 显示
              </input>
              <hr/>
              <a href="https://github.com/waterblock79/aerfaying-explore" style="display: block;font-weight: bold;text-align: center;">开源于 waterblock79/aerfaying-explore</a>
           </div>
        `);
    }
    // 在用户下拉栏里植入打开插件设置的摁键
    document.querySelector('.user-dropdown-menu_wrapper_3RsXx').insertBefore( document.createElement('li'), document.querySelector('#nav-settings') ).innerHTML = `<a onclick="openSetting();"><span>插件设置</span></a>`;
    //
    // === 转化全屏蓝色加载 ===
    // explore:loading = 0: 不改变, 1: 隐藏并启用左下加载提示, 2: 完全隐藏
    if( localStorage.getItem('explore:loading') == null ){
        localStorage.setItem('explore:loading', 1)
    }
    // 如果 explore:loading 设置是 1 或 2
    if( localStorage.getItem('explore:loading') >= 1 ) {
        var onLoading = false, onProjectLoading = false;
        // 把原先的加载遮盖的 Class 加上 Display: none 屏蔽掉
        ;
        let style = document.createElement('style');
        style.innerHTML = '.loader_background_1-Rwn { display: none !important }'
        document.head.appendChild(style);
        ;
        // 一个小工具，传入选择器，若元素存在便返回 true
        var elementExist = (dom) => { return document.querySelector(dom) != null ? true : false }
        // 当 explore:loading 设置为 1 便显示左下角加载提示
        if( localStorage.getItem('explore:loading') == 1 ) {
            // 轮询检测原先全屏加载出现
            setInterval(()=>{
                // 检测全屏加载遮盖是否存在（用了 not 选择器来排除掉咱自己创建的那个作品加载遮盖）
                if(elementExist('.loader_background_1-Rwn:not(#explore-loading-project)')){
                    // 如果 onLoading 还没被设为 true，那说明还没添加左下角加载提示，就加上先
                    if(onLoading == false){
                        // 隐藏原先全屏加载遮盖
                        document.querySelector('.loader_background_1-Rwn').style.display = 'none';
                        // 添加左下角加载提示
                        let loadingElement = document.createElement('div');
                        loadingElement.style = "width: 5em; height: 5em; position: fixed; background-color: #4c97ff; right: 5%; opacity: 0.8; bottom: 5%; border-radius: 8px;";
                        loadingElement.id = "explore-loading";
                        loadingElement.innerHTML = '<div class="loader_block-animation_2EgCQ" style="height: 3em;margin: 1em 1em 1em 1.25em;"><img class="loader_top-block_1-yuR" src="https://cdn.gitblock.cn/static/images/209cd016f099f4515cf80dff81e6e0f7.svg" style="margin: 0;"><img class="loader_middle-block_2ma0T" src="https://cdn.gitblock.cn/static/images/ab844ae9647bd855ed2f15b22c6b9337.svg" style="margin: 0;"><img class="loader_bottom-block_ABwSu" src="https://cdn.gitblock.cn/static/images/ee4f8261355c8d3b6fd7228a386c62be.svg" style="margin: 0;"></div>';
                        document.body.appendChild(loadingElement)
                        // 把 onLoading 设为 true
                        onLoading = true;
                        // 然而隐藏了蓝色加载提示，作品加载的时候那个没加载出来的白色舞台就会暴露给用户，于是便要给加载中的作品来一个遮盖。
                        // 如果 onProjectLoading 还没被设为 true，而且是作品在加载（全屏加载遮盖带有类似“加载拓展”等的提示消息）、作品区已经被创建（检测页面上是否有作品区控制区域，就是绿旗、红六边形那个区域）
                    } else if ( onLoading == true && onProjectLoading == false && elementExist('.loader_message-container-outer_oYjTv') && elementExist('.stage-header_stage-header-wrapper_8psPs') ) {
                        // 这里检测是否是手机端依靠的是手机端的舞台区域的 class 是 ...-wrapper-mobile_2WJLy，和电脑端不一样
                        // 使作品区控制区域不可点击（如果是手机端就直接隐藏了）
                        document.querySelector('.stage-header_stage-header-wrapper_8psPs').style = elementExist('.stage-wrapper_stage-canvas-wrapper-mobile_2WJLy') ? 'display: none;' : 'opacity: 0.5; pointer-events: none;'; // 使其不可点击
                        // 对症下药，如果是手机端就改手机端的 ...-wrapper-mobile_2WJLy，如果是电脑端就改电脑端的 ...-wrapper_n2Q5r，给它用 Display: none 隐藏掉
                        document.querySelector( elementExist('.stage-wrapper_stage-canvas-wrapper-mobile_2WJLy') ? '.stage-wrapper_stage-canvas-wrapper-mobile_2WJLy' : '.stage-wrapper_stage-canvas-wrapper_n2Q5r').style = 'display: none'; // 隐藏
                        // 在作品区添加加载中的蓝色方框（这里其实是把原来的舞台隐藏掉，拿这个东西放上去，看起来像是给原来的舞台加了遮盖，但其实并不是遮盖）
                        let projectLoadingDOM = document.createElement('div');
                        projectLoadingDOM.style = "position: relative; border-radius: 8px; padding: 8px; display: block !important; z-index: 1 !important;";
                        projectLoadingDOM.id = "explore-loading-project";
                        projectLoadingDOM.classList.add("loader_background_1-Rwn");
                        projectLoadingDOM.innerHTML = '<div><div class="loader_block-animation_2EgCQ"><img class="loader_top-block_1-yuR" src="https://cdn.gitblock.cn/static/gui/static/assets/bbbd98ae6a34eac772e34a57aaa5f977.svg"><img class="loader_middle-block_2ma0T" src="https://cdn.gitblock.cn/static/gui/static/assets/f9dce53613d5f85b311ce9f84423c08b.svg"><img class="loader_bottom-block_ABwSu" src="https://cdn.gitblock.cn/static/gui/static/assets/ce5820b006d753e4133f46ae776f4d96.svg"></div><div class="loader_title_28GDz"><span>载入项目</span></div><div class="loader_message-container-outer_oYjTv"><div class="loader_message-container-inner_3ck0d" style="transform: translate(0px, -75px);"><div class="loader_message_rvm_w"><span>正在创建积木……</span></div><div class="loader_message_rvm_w"><span>载入角色……</span></div><div class="loader_message_rvm_w"><span>载入声音……</span></div><div class="loader_message_rvm_w"><span>加载扩展……</span></div><div class="loader_message_rvm_w"><span>正在创建积木……</span></div><div class="loader_message_rvm_w"><span>呼唤小猫……</span></div><div class="loader_message_rvm_w"><span>传送Nano……</span></div><div class="loader_message_rvm_w"><span>给Gobo充气 …</span></div><div class="loader_message_rvm_w"><span>准备表情……</span></div></div></div></div>';
                        document.querySelector('.stage-wrapper_stage-wrapper_3k56F').appendChild(projectLoadingDOM);
                        // 把 onProjectLoading 设为 true
                        onProjectLoading = true;
                    }
                    // 如果全屏加载遮盖已经消失了，但是 onLoading 还是 true，说明还没给原来的左下角/作品加载提示移除掉
                } else if ( onLoading == true ){
                    // 移除左下角加载提示
                    document.querySelector('#explore-loading').remove();
                    if( onProjectLoading == true ) {
                        // 把原来禁止点击的、隐藏的恢复原状
                        document.querySelector('.stage-header_stage-header-wrapper_8psPs').style = '';
                        document.querySelector( elementExist('.stage-wrapper_stage-canvas-wrapper-mobile_2WJLy') ? '.stage-wrapper_stage-canvas-wrapper-mobile_2WJLy' : '.stage-wrapper_stage-canvas-wrapper_n2Q5r').style = '';
                        // 移除加载的蓝色方框
                        document.querySelector('#explore-loading-project').remove();
                        onProjectLoading = false;
                    }
                    // 把 onLoading 设为 false
                    onLoading = false;
                }
            },100)
        }
    }
    //
    // 添加不文明用语警告的“不再提示”
    window.disableBadWordsWarning = false;
    setInterval(()=>{
        if( document.querySelector('.body.box_box_tWy-0') == null ) return;
        if ( document.querySelector('.body.box_box_tWy-0').innerHTML.includes('正在提交的内容中包含疑似不文明用语') ) {
            // 禁用了不文明用语警告，那就直接点“确定”
            if(window.disableBadWordsWarning) {
                document.querySelector('.ok-button').click();
                // 如果未禁用不文明用语警告，并且也还没有添加“不再提示”的 checkbox，那就添加上
            } else if ( !document.querySelector('.body.box_box_tWy-0').childNodes[0].innerHTML.includes('checkbox') ){
                document.querySelector('.body.box_box_tWy-0').childNodes[0].innerHTML += '<br><input type="checkbox" style="margin-top: 1em;" onclick="window.disableBadWordsWarning = !window.disableBadWordsWarning"> 谢了，我知道该怎么做';
            }
        }
    },200);
    // 去除用户主页内容 maxWidth 限制
    let noneMaxWidthStyle = document.createElement('style');
    noneMaxWidthStyle.innerHTML = '.user-home_userInfo_2szc4 { max-height: none !important } ';
    document.head.appendChild(noneMaxWidthStyle);
    // 屏蔽导致 Out of Memory 崩溃的图片
    setInterval(()=>{
        document.querySelectorAll('img').forEach( item => {
            if(item.src.toLowerCase().includes('2732ede113494b63a42c176a86e7fcd9.svg')){
                let parent = item.parentElement;
                item.src = '';
                item.remove();
            }
        })
    },100);
    // 屏蔽奥的灰烬推荐
    if( localStorage.getItem('explore:no_ads') == 'on' ) {
        setInterval(()=>{
            // 评论区推荐
            try{
                document.querySelector('.comment_handleBtn_hP56Y > span.icon.icon-lg').parentNode.parentNode.parentNode.parentNode.remove();
            } catch(e){}
            // 作品下方或发现页推荐
            try {
                document.querySelector('.project-ads_ad_1uy0F').remove();
            } catch(e) {}
        }, 150);
    }
})();

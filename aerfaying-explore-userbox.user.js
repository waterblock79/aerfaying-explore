// ==UserScript==
// @name         高效探索 - 用户简讯框
// @namespace    https://waterblock79.github.io/
// @version      1.0.0
// @description  Aerfaying-Explore 插件的用户简讯框功能提取
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

(function() {
    const encodeHtml = Blockey.Utils.encodeHtml;
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
                    "level-0": "user-flag-level_level-0_3jAPd",
                    "level-1": "user-flag-level_level-1_zBVua",
                    "level-2": "user-flag-level_level-2_m_Fd9",
                    "level-3": "user-flag-level_level-2_m_Fd9",
                    "level-4": "user-flag-level_level-4_8-BW2",
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
                   <img src="https://cdn.gitblock.cn/Media?name=${ data.thumbId != null ? data.thumbId : 'E5E524F9459436757759454D28DA79A0.png' }" style="width: 5em;margin-left: 1em;margin-right: 1em;border: solid 1px rgb(241,241,241);border-radius: 50%;">
                   <div>
                      <a href="/Users/${data.id}" class="comment_name_2ZnFZ inBox" target="_blank" style="display: block; vertical-align: sub;">
                         ${ encodeHtml(data.username) }
                      </a>
                      <i class="small human-verified ${ humanVerifiedClass[data.humanVerifiedLevel] }" style="font-size: 125%;${ data.humanVerifiedLevel == 0 ? 'display: none' : '' }"></i>
                      <small class="user-flag-level_level_1N07n ${levelClass(data.level)}" style="margin-right: 0.5em;">Lv.${data.level}</small>
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
})();

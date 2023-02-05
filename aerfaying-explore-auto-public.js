// ==UserScript==
// @name         Aerfaying Explore - 自动公开评论
// @namespace    waterblock79.github.io
// @version      1.1.0
// @description  在阿儿法营/稽木世界中自动公开评论，脚本仅供学习交流使用。
// @author       waterblock79
// @match        http://gitblock.cn/*
// @match        https://gitblock.cn/*
// @match        http://aerfaying.com/*
// @match        https://aerfaying.com/*
// @icon         https://cdn.gitblock.cn/Media?name=D4DDE4D2DFCFCD8D6FDEB2961097ACDE.svg
// @grant        none
// @license      MIT
// ==/UserScript==

(async function () {
   // 获取元素的父级元素列表
   const getElementParents = (element) => {
      let current = element, result = [];
      while (current.parentElement !== null) {
         result.push(current.parentElement);
         current = current.parentElement;
      }
      return result;
   }
   // 询问是否开启
   if (localStorage['allow-auto-public'] == undefined) {
      await Blockey.Utils.confirm('启用自动公开评论', `
            该用户脚本用于<b>自动公开可见的全部“仅好友可见”评论</b>，仅供学习参考使用。<br/>
            若您同意应用该功能，请点击“确定”；若您不同意启用该功能、或者您不清楚这个脚本的用途，请移除该脚本。
        `).then(() => {
         localStorage['allow-auto-public'] = true;
      }).catch(() => {
         localStorage['allow-auto-public'] = false;
      })
   }
   // 判断是否开启
   if (localStorage['allow-auto-public'] == false) {
      return;
   }
   console.log('Aerfaying-Explore - 自动公开评论已启用');
   // 自动检测并公开
   setInterval(() => {
      document.querySelectorAll('.comment_comment_P_hgY[id] .comment_handleBtn_hP56Y > span').forEach(item => {
         // 防止有人在个人简介等地方伪装公开按钮，导致未经允许的情况下打开未知链接
         if (getElementParents(item).find(item => item.classList.contains('markdown_body_1wo0f'))) return;
         // 判断是否匹配并点击
         if (item.innerHTML == '公开' && Blockey.Utils.getContext().targetType != 'ForumPost') {
            item.click();
         }
      });
   }, 1000);
})();
<div align="center">
  <h1>aerfaying-explore</h1>
</div>

这是一个阿儿法营（aerfaying.com）/稽木世界（gitblock.cn）社区 Userscript，提供了一些小功能来优化社区的探索体验。本 Userscript 完全开源，欢迎在 Github 仓库 [waterblock79/aerfaying-explore](https://github.com/waterblock79/aerfaying-explore) 提出建议、反馈 Bug 或查看源代码。

## 目录

- [前置浏览器插件](#前置浏览器插件) - 安装浏览器插件来使用 Userscript
- [安装插件](#安装插件) - 安装这个 Userscript
- [功能](#功能) - 这个 Userscript 有什么功能？
- [其他](#其他) - 还有什么 Userscript 可以安装？

## 前置浏览器插件

使用此脚本需要安装 Userscript 的相关浏览器插件，强烈推荐使用 [Tampermonkey](https://www.tampermonkey.net/) 或 [Userscripts（Safari 浏览器用户）](https://apps.apple.com/us/app/userscripts/id1463298887)，安装方法如下：

- Chrome 浏览器：由于某些限制，请百度“油猴安装教程”，这里推荐参考这篇[少数派文章](https://sspai.com/post/40485)，此处不再赘述。
- Edge 浏览器：在 [Edge 外接程序](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) 安装。
- Firefox 浏览器：在 [Firefox Browser ADD-ONS](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/) 安装。
- Safari 浏览器（iOS、MacOS）：App Store 中下载 [Userscript](https://apps.apple.com/cn/app/userscripts/id1463298887)。
- 在 Android 系统：参考知乎文章 [这款浏览器在手机上也能安装油猴等各种扩展插件](https://zhuanlan.zhihu.com/p/31780613)。

## 安装插件

若您已经安装 Tampermonkey 插件，可以通过点击下方链接安装此脚本：

<img src="https://user-images.githubusercontent.com/33573572/169181677-f47bf907-91cb-4513-89f9-3b11b4315787.png" style="width: 5em; margin: 1em;" align="right"/>

- [**jsDeliver（推荐）**](https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/aerfaying-explore.user.js)
- [Github Raw](https://github.com/waterblock79/aerfaying-explore/raw/main/aerfaying-explore.user.js)

如果您在使用其他的浏览器插件，请参考您所使用的插件文档并善用搜索引擎进行安装。

如果您是 iOS 或 MacOS 的用户并在使用 Userscripts 这款浏览器插件，请参考[官方文档（英文）](https://github.com/quoid/userscripts#usage)进行安装，可能稍微有点麻烦，请做好心理准备:p

## 功能

**插件设置在菜单导航条下（如右图）。**

1. 将原先全屏的加载遮盖替换为一个小加载提示

   <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/加载提示.svg" style="width: 20em; border-radius: 4px; background: white;"/>
2. 通过点击用户主页顶部的用户名可以给用户添加备注

   <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/用户备注.png" style="width: 20em; border-radius: 4px;"/>
3. 添加不文明用语警告不再提示（页面内生效）

   <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/不再提示不文明用语警告.png" style="width: 20em;"/>
4. 显示用户的邀请人

   <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/显示用户的邀请人.png" style="width: 20em;"/>
5. 显示评论 ID 及详细信息

   <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/显示评论ID.png" style="width: 20em;"/><br/>

   <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/显示评论信息.png" style="width: 20em;"/>
6. 在手机端显示用户的金币数量

   <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/手机端显示金币数.png" style="width: 20em;"/>
7. 可以仅显示单行的精华作品推荐
8. 自适应高度的输入框

   <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/输入框自动调整高度.gif" style="width: 20em"/>
9. 复制页面 Markdown 链接

   <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/复制链接.png" style="width: 20em"/>
10. 在评论时添加贴吧表情图片（实验性功能）

    <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/贴吧表情1.png" style="width: 20em"/>

    <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/贴吧表情2.png" style="width: 20em"/>
11. 作品全屏浏览时禁止页面滚动
12. 插件检查更新

    <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/检查更新.png" style="width: 20em"/>
13. 在手机端的物品页面中显示物品图鉴、拍卖行导航

    <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/在手机端的物品页面中显示导航.png" style="width: 20em"/>
14. 在 aerfaying.com、gitblock.cn 和 3eworld.cn 间实现自动跳转
15. 编辑评论时预览 Markdown 效果

    <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/%E9%A2%84%E8%A7%88%E8%AF%84%E8%AE%BAMarkdown.png" style="width: 20em"/>
16. 在消息页面预览回复的内容

    <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/消息页面预览回复内容.png" style="width: 20em"/>
17. 使用快捷键 Ctrl + Space 快捷搜索内容

	 <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/本地搜索.png" style="width: 20em"/>


## 其他

- 用户简讯框功能可以在鼠标悬停于评论区的用户名上时显示一个展示用户信息的简讯框，此功能分离于插件，可以通过以下渠道单独安装：

  <img src="https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@main/assets/用户简讯框.png" style="width: 20em"/>

  - [Github Raw - aerfaying-explore-userbox.user.js](https://github.com/waterblock79/aerfaying-explore/raw/main/aerfaying-explore-userbox.user.js)
  - [jsDeliver CDN](https://fastly.jsdelivr.net/gh/waterblock79/aerfaying-explore@master/aerfaying-explore-userbox.user.js)

// ==UserScript==
// @name         bilibili 黑暗模式
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  为网页增加黑暗模式
// @author       fwqaaq
// @match        https://*.bilibili.com/*
// @icon         https://static.hdslb.com/mobile/img/512.png
// @grant        GM_addStyle
// @grant        GM.addStyle
// @run-at       document-idle
// ==/UserScript==

const css = `
:root {
  --Ga0: #18191C;
  --Ga1: #2F3238;
  --Ga2: #484C53;
  --Ga3: #61666D;
  --Ga7: #C9CCD0;
  --Ga8: #C9CCD0;
  --Ga9: #F1F2F3;
  --Ga10: #F6F7F8;

  --bg1: var(--Ga0);
  --bg2: var(--Ga0);
  --bg3: var(--Ga0);
  --text1: var(--Ga10);
  --bg1_float: var(--Ga0);
  --bpx-aux-header-bg: var(--Ga1);
  --graph_bg_thick: var(--Ga1);
  --graph_bg_thin: var(--Ga1);
  --graph_bg_regular: var(--Ga1);
  --bpx-dmsend-main-bg: var(--Ga0);
  --bpx-dmsend-input-bg: var(--Ga1);
}

.bili-header .center-search-container .center-search__bar .nav-search-content .nav-search-input,
.nav-search-content {
  background-color: var(--Ga1);
}

.history-list div.r-info,
.b-head-search_input {
  background-color: var(--Ga0);
}

.history-list .r-info .title,
.history-wrap .b-head span.b-head-t {
  color: white;
}

/*space*/
.owner,
div.n .n-inner,
#page-dynamic .col-2 .section,
.col-full,
#page-index .col-1,
#page-index .col-2 .section,
.space_input,
.be-dropdown-menu,
li.be-dropdown-item,
div.fixed-top-header {
  color: white;
  background-color: var(--Ga0);
}

div.right-side-bar .side-toolbar[data-v-0974dd01] {
  background: #000;
}

#page-fav .fav-sidenav .favlist-title,
#page-fav .fav-sidenav .watch-later,
#page-fav .fav-sidenav .nav-title .text,
a.text,
#page-fav .fav-main .filter-item .text,
h2.article-title,
div.fixed-top-header .inner>p,
.article-breadcrumb .breadcrumb-name,
.article-breadcrumb .slash,
.article-breadcrumb a.breadcrumb-name,
.article-breadcrumb span.breadcrumb-title {
  color: white;
}

/*account*/
.international-footer a,
.h-safe-title[data-v-41f3acf9],
.h-reward-info[data-v-41f3acf9],
.mini-type .nav-user-center .user-con .item span.name,
.international-header .mini-type .nav-link .nav-link-ul .nav-link-item .link:hover,
span.security-nav-name[data-v-42a60642],
.re-exp-info[data-v-db995076],
span.h-reward-info[data-v-af447702],
span.home-dialy-task-title[data-v-db995076],
span.home-top-msg-name[data-v-389e9a45],
span.curren-b-num[data-v-389e9a45],
i.now-num[data-v-852cd7a8],
.international-header .mini-type .nav-link .nav-link-ul .nav-link-item a.link,
.van-popover .mini-type .nav-link .nav-link-ul .nav-link-item a.link,
.trending-item,
.vip-m .bubble-traditional .recommand .title,
.vip-m .bubble-traditional .recommand .bubble-col .item .recommand-link,
span.title,
.header-video-card .video-info .line-2[data-v-7f8e09fd] {
  color: white;
}

.security-list[data-v-42a60642]:hover {
  background-color: #000;
}

div.suggest-wrap[data-v-340b780a],
.international-header .mini-type .nav-search #nav_searchform,
.van-popover .mini-type .nav-search #nav_searchform,
.header-video-card[data-v-7f8e09fd]:hover,
.van-popper-favorite .tab-item--normal[data-v-7cd0c1b6]:hover {
  color: white;
  background-color: #2F3238;
}

body,
#app,
.mini-header--login,
.security_content,
.security-left,
.security-right,
div.international-footer,
.box,
div.home-top-level-mask-warp[data-v-852cd7a8],
div.live-box[data-v-5e2bd0c0],
div.app-layout[data-v-0b4aa428],
div.download-wrapper,
div.bubble-traditional,
.im-list-box,
div.vp-container {
  color: white;
  background-color: #18191C;
}

/*live*/
div.search-pannel[data-v-3d87ad4b],
#nav-searchform.is-actived div.search-bar[data-v-efd5efe0],
#nav-searchform.is-focus div.search-bar[data-v-efd5efe0],
div.link-panel-ctnr[data-v-7303c5c4],
div.user-panel-ctnr .user-panel[data-v-2051b66d],
div.calendar-checkin[data-v-5a710d87],
div.calendar-checkin .title[data-v-5a710d87],
div.calendar-checkin .calendar-wrapper[data-v-5a710d87],
div.calendar-checkin .checkin-btn[data-v-5a710d87],
div.link-panel-ctnr .load-more .load-more-btn[data-v-7303c5c4] {
  background-color: var(--Ga0);
}

/*t*/

div.bili-user-profile {
  background-color: var(--Ga0);
}

div.bili-dyn-live-users,
div.bili-dyn-my-info,
div.bili-dyn-my-info--skeleton,
div.bili-dyn-list-tabs,
div.bili-dyn-publishing,
div.bili-dyn-up-list,
div.bili-dyn-item,
div.bili-dyn-banner,
div.topic-panel {
  background-color: var(--Ga1);
}

div.bili-dyn-live-users__title,
div.bili-dyn-live-users__item__uname {
  color: white;
}

/*message*/
div.space-left[data-v-20f352ce],
div.card[data-v-fb77dc7a],
div.space-right .space-right-top .title[data-v-20f352ce] {
  background-color: var(--Ga0);
}

#link-message-container * {
  color: white;
}

#link-message-container *:hover {
  color: #2faee3;
}
`

GM.addStyle(css)
// ==UserScript==
// @name           bilibili 视频下载
// @version        0.01.20
// @license        MIT
// @description    bilibili mp4 格式视频下载脚本，支持多种格式
// @icon           https://static.hdslb.com/mobile/img/512.png
// @author          fwqaaq
// @namespace      https://github.com/fwqaaq/scripts
// @match          *://www.bilibili.com/video/BV*
// @match          *://m.bilibili.com/video/BV*
// @run-at         document-body
// @grant          GM.addStyle
// @grant          GM_addStyle
// @require        https://cdn.jsdelivr.net/npm/js-md5@0.8.3/src/md5.min.js
// @downloadURL https://update.greasyfork.org/scripts/481459/bilibili%20%E8%A7%86%E9%A2%91%E4%B8%8B%E8%BD%BD.user.js
// @updateURL https://update.greasyfork.org/scripts/481459/bilibili%20%E8%A7%86%E9%A2%91%E4%B8%8B%E8%BD%BD.meta.js
// ==/UserScript==

const downloadIcon = '<svg xmlns="http://www.w3.org/2000/svg" height="32" width="32" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/></svg>'

const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52
]

const getMixinKey = (orig) => mixinKeyEncTab.map(n => orig[n]).join('').slice(0, 32)

// 为请求参数进行 wbi 签名
function encWbi(params, img_key, sub_key) {
    const mixin_key = getMixinKey(img_key + sub_key),
          curr_time = Math.round(Date.now() / 1000),
          chr_filter = /[!'()*]/g

    Object.assign(params, { wts: curr_time }) // 添加 wts 字段
    // 按照 key 重排参数
    const query = Object
    .keys(params)
    .sort()
    .map(key => {
        // 过滤 value 中的 "!'()*" 字符
        const value = params[key].toString().replace(chr_filter, '')
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')

    const wbi_sign = md5(query + mixin_key) // 计算 w_rid
    return query + '&w_rid=' + wbi_sign
}

// 获取最新的 img_key 和 sub_key
async function getWbiKeys() {
    const response = await fetch('https://api.bilibili.com/x/web-interface/nav')
    if (!response.ok) throw new Error("获取 wbi 失败，你的 HTTP 响应状态码是 ${response.status}")
    const { code, data: { wbi_img: { img_url, sub_url } } } = await response.json()
    if (code === "-101") console.log("仅能下载 720p 以下的视频")
    return {
        img_key: img_url.slice(
            img_url.lastIndexOf('/') + 1,
            img_url.lastIndexOf('.')
        ),
        sub_key: sub_url.slice(
            sub_url.lastIndexOf('/') + 1,
            sub_url.lastIndexOf('.')
        )
    }
}

// 获取 bvid
function getBvid() {
    const { pathname } = window.location
    const bvid = pathname.split('/').find(item => item.startsWith("BV"))
    return bvid
}

// 获取 cid
async function getCid(bvid) {
    const res = await fetch(`https://api.bilibili.com/x/player/pagelist?bvid=${bvid}&jsonp=jsonp`)
    const { data: [{ cid }], code } = await res.json()
    if (!res.ok) throw new Error(`获取 cid 失败，HTTP 响应状态码是 ${res.status}. code 码是 ${code}`)
    return cid
}

// 通过 dom 节点设置进度
async function getVideo(qn, fnval, dom) {
    const [url, bvid] = await getVideoUrl(qn, fnval)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`视频下载失败，响应状态码为 ${res.status}`)
    // 进度
    const progress = (response) => {
        const total = response.headers.get("Content-Length")
        let loaded = 0
        const [dataStream, progressStream] = response.body.tee()
        const reader = progressStream.getReader()
        const logger = (reader) => {
            reader.read().then(({ done, value }) => {
                if (done) {
                    return
                }
                loaded += value.length
                dom.innerText = `${(loaded / total * 100).toFixed(0)}%`
                logger(reader)
            })
        }
        logger(reader)
        return new Response(dataStream)
    }

    const blob = await progress(res).blob()
    const video = URL.createObjectURL(blob)
    dom.href = video
    dom.download = `${bvid}.mp4`
    dom.click()
    URL.revokeObjectURL(video)
    dom.remove()
    return true
}

async function getVideoUrl(qn = 112, fnval = 1) {
    const bvid = getBvid()
    const cid = await getCid(bvid)
    const params = { bvid, cid, qn, fnval, fnver: 0, fourk: 1 }
    const { img_key, sub_key } = await getWbiKeys()
    const query = encWbi(params, img_key, sub_key)
    const res = await fetch(`https://api.bilibili.com/x/player/wbi/playurl?${query}`)
    if (!res.ok) throw new Error(`你的视频下载链接获取失败，你的响应状态码是 ${res.status}`)
    const { data: { durl: [{ url }] } } = await res.json()
    return [url, bvid]
}

function createDownloaderElement() {
    const downloader = document.createElement("div")
    downloader.classList.add("downloader-icon")
    const nav = document.createElement("nav")
    nav.classList.add("downloader-nav")
    nav.innerHTML = `<div data-id="16" class="a-flag">360P 流畅</div>
                 <div data-id="32" class="a-flag">480P 清晰</div>
                 <div data-id="64" class="a-flag">720P 高清</div>
                 <div data-id="74" class="a-flag">720P60 高帧率（登陆）</div>
                 <div data-id="80" class="a-flag">1080P 高清（登陆）</div>
                 <div data-id="112" class="a-flag">1080P+ 高码率（大会员）</div>
                 <div data-id="116" class="a-flag">1080P60 高帧率（大会员）</div>
                 <div data-id="120" class="a-flag">4K 超清（大会员）</div>
                 <div class="a-flag"><a target="_blank" href="https://github.com/fwqaaq/scripts">有问题请点击该链接🔗</a></div>`

    downloader.innerHTML = `
        <div style="display: flex;justify-content: center;margin: 0 auto;align-items: center;height: inherit;">
        ${downloadIcon}
        </div>`
    downloader.appendChild(nav)
    return [downloader, nav]
}

function addStyles() {
    const styles = `
      :root{
        --init-left: 48px;
        --icon-width: 48px;
        --icon-height: 48px;
        --nav-width: 200px;
        --nav-height: 260px;
      }
      .downloader-icon {
        width: var(--icon-width);
        height: var(--icon-height);
        background: rgb(255,117,152);
        cursor: pointer;
        border-radius: 50%;
        position: fixed;
        left: var(--init-left);
        top: 74px;
        z-index: 9999;
      }
      .a-flag {
        display: flex;
        justify-content: space-between;
        padding: 4px 8px;
        border: rgb(242,110,137) solid 1px;
      }
      .a-flag:hover {
        color: blue;
      }
      .downloader-nav {
        display: flex;
        flex-direction: column;
        width: var(--nav-width);
        background: rgba(255,117,152, 0.8);
        transform: translateX(calc(-50% + var(--icon-width) / 2));
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.5s;
      }
      .downloader-icon:hover .downloader-nav {
        height: auto;
        max-height: var(--nav-height);
      }
    `
    GM.addStyle(styles)
}

function setupEventListener(downloader, nav, callback) {
    let xOffsetElement = 0, yOffsetElement = 0
    let noClick = false
    const move = (e) => {
        noClick = true
        // 拖动的时候，也隐藏 nav
        if (!nav.hidden) nav.hidden = !nav.hidden
        e.currentTarget.style.left = e.clientX - xOffsetElement + 'px'
        e.currentTarget.style.top = e.clientY - yOffsetElement + 'px'
    }
    downloader.addEventListener("mousedown", (e) => {
        noClick = false
        const rect = e.currentTarget.getBoundingClientRect()
        xOffsetElement = e.clientX - rect.left
        yOffsetElement = e.clientY - rect.top
        downloader.addEventListener("mousemove", move)
    })

    document.addEventListener("mouseup", (e) => {
        if (nav.hidden) nav.hidden = !nav.hidden
        downloader.removeEventListener("mousemove", move)
    })

    downloader.children[0].addEventListener("click", (e) => {
        if (noClick) return
    })

    // flag 标志：为 true 才会执行整个函数
    let flag = true
    const debounce = (func, wait, immediate) => {
        let timer = null
        return (e) => {
            if (!flag) return
            let isImmediate = !timer && immediate
            if (timer) clearTimeout(timer)
            if (isImmediate) {
                func(e)
                return
            }
            timer = setTimeout(() => {
                func(e)
                timer = null
            }, wait)
        }
    }

    const downloadVideo = async (e) => {
        flag = false
        const id = e.target.dataset.id
        if (e.target.matches('a') || !id) return
        const a = document.createElement('a')
        e.target.appendChild(a)
        try {
            flag = await callback(id, 1, a)
        } catch(e){
            alert("没有下载成功，请重新下载")
            flag = true
        }

    }
    nav.addEventListener("click", debounce(downloadVideo, 3000, flag, true))
}

function init() {
    const [downloader, nav] = createDownloaderElement()
    const fragment = document.createDocumentFragment()
    fragment.appendChild(downloader)
    document.body.appendChild(fragment)
    addStyles()
    setupEventListener(downloader, nav, getVideo)
}

init()

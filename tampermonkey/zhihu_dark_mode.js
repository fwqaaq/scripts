// ==UserScript==
// @name        知乎黑暗模式
// @version     0.1
// @namespace   https://github.com/fwqaaq/scripts
// @author      fwqaaq
// @icon        https://static.zhihu.com/heifetz/assets/apple-touch-icon-120.d5793cac.png
// @description 知乎黑暗模式（原生）
// @match       *://*.zhihu.com/*
// @run-at      document-start
// ==/UserScript==

function main() {
  const url = window.location.href
  if (url.includes('www.zhihu.com/signin')) {
    window.location.href = 'https://www.zhihu.com/explore?theme=dark'
    return
  }
  if (url.includes('?')) {
    if (!url.includes('theme=dark')) window.location.href += '&theme=dark'
  } else {
    window.location.href += '?theme=dark'
  }
}

window.addEventListener('load', (e) => {
  const btn = document.querySelector("button[aria-label='关闭']")
  btn.click()
})

main()

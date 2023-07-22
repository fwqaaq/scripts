// ==UserScript==
// @name         Github 网页图标主题
// @name:en      Github web icon theme
// @namespace    https://github.com/fwqaaq/scripts
// @version      0.6
// @description  美化 Github 网页仓库图标
// @description:en Beautify Github repo icons
// @author       fwqaaq
// @match        https://github.com/*
// @icon         https://github.githubassets.com/favicons/favicon-dark.png
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// ==/UserScript==

const getData = (() => {
    const cacheData = GM_getValue('icons')
    return async () => {
        if (cacheData) {
            return cacheData
        }
        const url = 'https://gist.githubusercontent.com/fwqaaq/92e8f52194d705f76580ee396ea2791b/raw/64c1e16451adb47d1eef24d07aab1f0498fd0d13/icons.json'
        const data = await new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                fetch: true,
                onload: (res) => {
                    resolve(res.responseText)
                }
            })
        })
        GM_setValue('icons', JSON.parse(data))
        return data
    }
})()

function memoize(fn) {
    let result = null
    return (icons) => {
        if (result !== null) {
            return result
        }
        result = fn(icons)
        return result
    }
}

const getFileDict = memoize((fileIcons) => {
    const fileDict = new Map()
    fileIcons.icons.forEach((icon) => {
        (icon.fileExtensions || []).forEach((ext) => {
            fileDict.set(ext, icon.name)
        });
        (icon.fileNames || []).forEach((name) => {
            fileDict.set(name, icon.name)
        })
    })
    return fileDict
})

const getDirDict = memoize((folderIcons) => {
    const dirDict = new Map()

    folderIcons[0].icons.forEach((icon) => {
        (icon.folderNames || []).forEach((name) => {
            dirDict.set(name, icon.name)
        });
    });
    return dirDict;
})

function splitFileAndDir() {
    const repoPage = document.querySelector('div[data-hpc]') || document.querySelector('tbody')
    // 没有直接返回
    if (!repoPage) return [false, false]
    const dir = new Map();
    const file = new Map();

    let row = repoPage.querySelectorAll('div[role="row"][class^="Box-row"], tr[id*="folder"] td[colspan] div.react-directory-filename-column')

    if (document.querySelector('div[data-hpc]')) {
        // Only when on the repo homepage
        row.forEach(item => {
            if (item.querySelector('[aria-label="Directory"]')) setMap(item, dir)
            if (item.querySelector('[aria-label="File"]')) setMap(item, file)
        })
    }

    if (document.querySelector('tbody')) {
        row.forEach(item => {
            const last = item.lastElementChild
            const type = last.lastElementChild.innerText
            if (type.includes('File')) setMap(item, file)
            if (type.includes('Directory')) setMap(item, dir)
        })
    }

    return [dir, file]
}

async function handleFileIcons(file, item, fileDict) {
    const key = matchFile(file, fileDict)
    // 后缀名匹配
    if (key !== '') {
        await replaceIcons(fileDict.get(key), item)
        return
    }
    // 文件名匹配
    if (fileDict.has(file)) {
        await replaceIcons(fileDict.get(file), item)
    }
}

function matchFile(file, fileDict) {
    const names = file.split('.')
    let name = names.at(-1), betterName = ''
    for (let i = names.length - 2; i >= 0; i--) {
        if (fileDict.has(name)) {
            betterName = name
        }
        name = names[i] + '.' + name
    }
    return betterName
}

async function handleDirIcons(file, item, dirDict) {
    if (dirDict.has(file)) {
        const name = dirDict.get(file)
        await replaceIcons(name, item)
    }
}

async function replaceIcons(name, item) {
    const url = `https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/${name}.svg`

    const svg = item.querySelector('div[role="gridcell"] > svg') || item.querySelector('svg')
    // 如果修改过，则直接返回
    if (!svg) return
    const newNode = document.createElement('img')
    newNode.src = url
    newNode.height = '16'
    svg.replaceWith(newNode)
}

function setMap(item, map) {
    /**
     * @type {string}
     */
    const title = item.querySelector('a[title]')?.title ?? item.querySelector('h3 > div[title]').innerText
    map.set(title.toLowerCase(), item)
}

async function collectTasks() {
    const [dir, file] = splitFileAndDir()
    if (dir === false || file === false) return Promise.reject('Not on the repo page')

    const { fileIcons, folderIcons } = await getData()
    const fileDict = getFileDict(fileIcons)
    const dirDict = getDirDict(folderIcons)
    const tasks = []
    for (const [fileName, item] of file) {
        tasks.push(handleFileIcons(fileName, item, fileDict))
    }
    for (const [dirName, item] of dir) {
        tasks.push(handleDirIcons(dirName, item, dirDict))
    }
    return tasks
}

async function main() {
    const tasks = await collectTasks()
    await Promise.allSettled(tasks)
    await Promise.resolve(setTimeout(main, 500))
}

main()

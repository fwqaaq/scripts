// ==UserScript==
// @name         Github 网页图标主题
// @name:en      Github web icon theme
// @namespace    https://github.com/fwqaaq/scripts
// @version      0.1
// @description  美化 Github 网页仓库图标
// @description:en Beautify Github repo icons
// @author       fwqaaq
// @match        https://github.com/*
// @icon         https://github.githubassets.com/favicons/favicon-dark.png
// @require      https://cdn.jsdelivr.net/gh/fwqaaq/scripts@main/tampermonkey/jsdelivr/icons_theme.js
// @license      MIT
// ==/UserScript==

function getFileDict() {
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
}

function getDirDict() {
    const dirDict = new Map()

    folderIcons[0].icons.forEach((icon) => {
        (icon.folderNames || []).forEach((name) => {
            dirDict.set(name, icon.name)
        });
    });
    return dirDict;
}

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
    if (betterName !== '') {
        await replaceIcons(fileDict.get(key), item)
    }
}

function matchFile(file, fileDict) {
    const names = file.split('.')
    let name = names.at(-1), betterName = ''
    for (let i = names.length - 2; i >= 0; i--) {
        if (fileDict.has(name)) {
            betterName = name
        }
        // 找到最全的匹配
        if (!fileDict.has(name)) {
            return betterName
        }
        name = names[i] + '.' + name
    }
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
    const title = item.querySelector('a[title]')?.title ?? item.querySelector('h3 > div[title]').innerText
    map.set(title, item)
}

function collectTasks() {
    const [dir, file] = splitFileAndDir()
    if (dir === false || file === false) return Promise.reject('Not on the repo page')

    const fileDict = getFileDict()
    const dirDict = getDirDict()
    const tasks = []
    for (const [fileName, item] of file) {
        tasks.push(handleFileIcons(fileName, item, fileDict))
    }
    for (const [dirName, item] of dir) {
        tasks.push(handleDirIcons(dirName, item, dirDict))
    }
    return tasks
}

function main() {
    new Promise(
        resolve => setTimeout(resolve, 500)
    ).then(
        () => Promise.allSettled(collectTasks())
    ).catch(
        reason => console.log(reason)
    )
}

let intervalId = setInterval(() => main(), 1000)
let timeoutId = setTimeout(() => clearInterval(intervalId), 10000)

window.addEventListener('unload', () => {
    clearTimeout(timeoutId)
})

main()
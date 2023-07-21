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

function getFileDict(){
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

function iter() {
    const [dir, file] = splitFileAndDir()
    const fileDict = getFileDict()
    const dirDict = getDirDict()
    for(const [fileName, item] of file){
        handleFileIcons(fileName, item, fileDict)
    }
    for(const [dirName, item] of dir){
        handleDirIcons(dirName, item, dirDict)
    }
}


function splitFileAndDir() {
    const repoPage = document.querySelector('div[data-hpc]') || document.querySelector('tbody')
    const dir = new Map();
    const file = new Map();

    let row = repoPage.querySelectorAll('div[role="row"][class^="Box-row"], tr[id*="folder"] td[colspan] div.react-directory-filename-column')

    if(document.querySelector('div[data-hpc]')) {
        // Only when on the repo homepage
        row.forEach((item, index)=>{
            if(item.querySelector('[aria-label="Directory"]')) setMap(item, dir)
            if(item.querySelector('[aria-label="File"]')) setMap(item, file)
        })
    }

    if(document.querySelector('tbody')) {
        row.forEach((item, index) => {
            const last = item.lastElementChild
            const type = last.lastElementChild.innerText
            if(type.includes('File')) setMap(item, file)
            if(type.includes('Directory')) setMap(item, dir)
        })
    }

    return [dir, file]
}

function handleFileIcons(file, item, fileDict) {
    const fileExt = file.split('.').at(-1)
    if(fileDict.has(fileExt)) {
        const name = fileDict.get(fileExt)
        replaceIcons(name, item)
        return
    }
    if(fileDict.has(file)){
        const name = fileDict.get(file)
        replaceIcons(name, item)
    }
}

function handleDirIcons(file, item, dirDict){
    if(dirDict.has(file)) {
        const name = dirDict.get(file) || "folder"
        replaceIcons(name, item)
    }
}

function replaceIcons(name, item){
    const url = `https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/${name}.svg`
    const svg = item.querySelector('div[role="gridcell"] > svg') || item.querySelector('svg')
    //const parent = svg && svg.parentNode
    //parent.innerHTML = `<img src="${url}"/>`
    const newNode = document.createElement('img')
    newNode.src = url
    newNode.height = '16'
    svg.replaceWith(newNode)
}

function setMap(item, map){
    const title = item.querySelector('a[title]')?.title ?? item.querySelector('h3 > div[title]').innerText
    map.set(title, item)
}

//window.onload = main

function main(){
    iter()
}

main()

// window.onload = main

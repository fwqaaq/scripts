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
// @license      MIT
// ==/UserScript==

function iter() {
  const [dir, file] = splitFileAndDir()
  const fileDict = getFileDict()
  const dirDict = getDirDict()
  for (const [fileName, item] of file) {
    handleFileIcons(fileName, item, fileDict)
  }
  for (const [dirName, item] of dir) {
    handleDirIcons(dirName, item, dirDict)
  }
}


function splitFileAndDir() {
  const repoPage = document.querySelector('div[data-hpc]');
  const row = repoPage.querySelectorAll('div[role="row"][class^="Box-row"]');
  const dir = new Map();
  const file = new Map();

  // Only when on the repo homepage
  row.forEach((item, index) => {
    if (item.querySelector('[aria-label="Directory"]')) {
      setMap(item, dir);
    }
    if (item.querySelector('[aria-label="File"]')) setMap(item, file)
  })

  return [dir, file]
}

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

function handleFileIcons(file, item, fileDict) {
  const fileExt = file.split('.').at(-1)
  if (fileDict.has(fileExt)) {
    const name = fileDict.get(fileExt)
    replaceIcons(name, item)
    return
  }
  if (fileDict.has(file)) {
    const name = fileDict.get(file)
    replaceIcons(name, item)
  }
}

function getDirDict(dir, item) {
  const dirDict = new Map()

  folderIcons[0].icons.forEach((icon) => {
    (icon.folderNames || []).forEach((name) => {
      dirDict.set(name, icon.name)
    });
  });
  return dirDict;
}

function handleDirIcons(file, item, dirDict) {
  if (dirDict.has(file)) {
    const name = dirDict.get(file)

    replaceIcons(name, item)
  }
}

function replaceIcons(name, item) {
  const url = `https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/${name}.svg`
  const svg = item.querySelector('div[role="gridcell"] > svg')
  const parent = svg && svg.parentNode
  parent.innerHTML = `<img src="${url}"/>`
}

function setMap(item, map) {
  const title = item.querySelector('a[title]').title
  map.set(title, item)
}

function main() {
  iter()
}

main()
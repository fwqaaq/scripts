import md5 from '@xn-02f/md5'

const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61,
  26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36,
  20, 34, 44, 52,
]

/**
 * @param {string} orig
 * @returns {string}
 */
const getMixinKey = (orig) =>
  mixinKeyEncTab
    .map((n) => orig[n])
    .join('')
    .slice(0, 32)

/**
 * 为请求参数进行 wbi 签名
 * @param {any} params
 * @param {string} img_key
 * @param {string} sub_key
 * @returns {string}
 */
function encWbi(params, img_key, sub_key) {
  const mixin_key = getMixinKey(img_key + sub_key),
    curr_time = Math.round(Date.now() / 1000),
    chr_filter = /[!'()*]/g

  Object.assign(params, { wts: curr_time }) // 添加 wts 字段
  // 按照 key 重排参数
  const query = Object.keys(params)
    .sort()
    .map((key) => {
      // 过滤 value 中的 "!'()*" 字符
      const value = params[key].toString().replace(chr_filter, '')
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')

  const wbi_sign = md5(query + mixin_key) // 计算 w_rid
  return query + '&w_rid=' + wbi_sign
}

// 获取最新的 img_key 和 sub_key
/**
 * @returns {Promise<{img_key: string, sub_key: string}>}
 */
async function getWbiKeys() {
  const response = await fetch('https://api.bilibili.com/x/web-interface/nav')
  if (!response.ok)
    throw new Error(`获取 wbi 失败，你的 HTTP 响应状态码是 ${response.status}`)
  try {
    const {
      data: {
        wbi_img: { img_url, sub_url },
      },
    } = await response.json()
    return {
      img_key: img_url.slice(
        img_url.lastIndexOf('/') + 1,
        img_url.lastIndexOf('.')
      ),
      sub_key: sub_url.slice(
        sub_url.lastIndexOf('/') + 1,
        sub_url.lastIndexOf('.')
      ),
    }
  } catch (e) {
    throw new Error(`获取 wbi 失败，错误信息是 ${e.message}`)
  }
}

/**
 * 获取 bvid 和 cid
 * @param {url} location
 * @returns {Promise<[string, string]>}
 */
async function getBvidAndCid(url) {
  const bvid = url.split('/').find((item) => item.startsWith('BV'))
  const res = await fetch(
    `https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`
  )
  if (!res.ok)
    throw new Error(
      `获取 cid 失败，HTTP 响应状态码是 ${res.status}: ${res.statusText}`
    )
  try {
    const {
      data: [{ cid }],
    } = await res.json()
    return [bvid, cid]
  } catch {
    throw new Error(`获取 cid 失败，不能结构响应`)
  }
}

/**
 * @param {string} link - bilibili video link
 * @param {string} [session] - bilibili session data
 * @param {32 | 64 | 74 | 80 | 112 | 116 | 120} qn - bilibili video quality
 * @returns {Promise<string>}
 */
export async function getVideoUrl(link, session, qn = 112) {
  const headers = new Headers()
  if (session) headers.set('cookie', `SESSDATA=${session}`)

  try {
    const [bvid, cid] = await getBvidAndCid(link)
    const params = { bvid, cid, qn, fnval: 1, fnver: 0, fourk: 1 }
    const { img_key, sub_key } = await getWbiKeys()
    const query = encWbi(params, img_key, sub_key)
    const res = await fetch(
      `https://api.bilibili.com/x/player/playurl?${query}`,
      { headers }
    )
    if (!res.ok)
      throw new Error(`获取视频链接失败，HTTP 响应状态码是 ${res.status}`)
    const {
      data: {
        durl: [{ url }],
      },
    } = await res.json()
    return url
  } catch (e) {
    throw new Error(`获取视频链接失败，错误信息是 ${e.message}`)
  }
}

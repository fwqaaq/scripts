import { getVideoUrl } from './link.js'
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
}

export default {
  /**
   * @param {import("@cloudflare/workers-types").Request} request
   * @param {{SESSDATA: string}} env
   * @returns
   */
  async fetch(request, env) {
    if (request.method.toUpperCase() !== 'GET')
      return new Response('仅支持 GET 请求', { headers })
    const url = new URL(request.url)
    const link = url.searchParams.get('bilibili')
    if (!link) return new Response('没有查询参数 bilibili', { headers })
    const qn = url.searchParams.get('qn') ?? 112
    const session = env.SESSDATA

    let sourceURL = ''
    if (link.includes('b23.tv')) {
      try {
        sourceURL = await handleShortLink(link)
      } catch (e) {
        return new Response(e, { headers })
      }
    } else if (link.includes('bilibili')) {
      sourceURL = link
    } else {
      return new Response('请发送正确的连接', { headers })
    }

    try {
      const videoUrl = await getVideoUrl(sourceURL, session, qn)
      return new Response(videoUrl, { headers })
    } catch (e) {
      return new Response(e, { headers })
    }
  },
}

/**@param {string} link  */
async function handleShortLink(link) {
  try {
    const res = await fetch(link, { redirect: 'manual' })
    const location = res.headers.get('location')
    if (!location) console.log('[ERROR]: location 标头是空的')
    const source = new URL(location)
    return source.origin + source.pathname
  } catch {
    throw new Error('b23.tv 短链接不正确')
  }
}

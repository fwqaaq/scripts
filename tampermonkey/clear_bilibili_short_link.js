/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
}

export default {
  /**
   * @param {Request} request
   * @param {*} env
   * @param {ExecutionContext} ctx
   * @returns
   */
  async fetch(request, env, ctx) {
    if (request.method.toUpperCase() !== 'GET')
      return new Response('仅支持 GET 请求', { headers })
    const tracked = new URL(request.url).searchParams.get('bilibili')
    if (
      !tracked ||
      !(tracked.includes('b23.tv') || tracked.includes('xhslink.com'))
    )
      return new Response('请发送带有正确跟踪短链的参数', { headers })
    const res = await fetch(tracked, { redirect: 'manual' })
    const location = res.headers.get('location') ?? null
    if (!location)
      return new Response('没有完整的跟踪链接，请查找输入是否正确', { headers })
    const source = new URL(location)
    return new Response(source.origin + source.pathname, { headers })
  },
}

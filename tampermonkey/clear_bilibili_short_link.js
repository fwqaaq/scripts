/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  /**
   * 
   * @param {Request} request 
   * @param {*} env 
   * @param {ExecutionContext} ctx 
   * @returns
   */
  async fetch(request, env, ctx) {
    if (request.method.toUpperCase() !== 'GET') return new Response("仅支持 GET 请求")
    const bilibili = new URL(request.url).searchParams.get("bilibili")
    if (!bilibili || !bilibili.includes("b23.tv")) return new Response("请发送带有正确 b 站短链的参数")
    const res = await fetch(bilibili, { redirect: 'manual' })
    const location = res.headers.get('location') ?? null
    if (!location) return new Response("没有完整的 b 站链接，请查找输入是否正确")
    const source = new URL(location)
    return new Response(source.origin + source.pathname)
  },
};
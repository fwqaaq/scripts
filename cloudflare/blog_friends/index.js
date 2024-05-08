const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
}

export default {
  /**
   *
   * @param {import("@cloudflare/workers-types").Request} request
   * @param {{DB: import("@cloudflare/workers-types").D1Database}} env
   * @returns
   */
  async fetch(request, env) {
    const db = env.DB
    const { method, url } = request
    const { pathname } = new URL(url)

    if (method === 'GET' && pathname === '/api/list') {
      const friends = await db.prepare('SELECT * FROM friends').all()

      if (friends.success) {
        return new Response(JSON.stringify(friends.results), {
          headers: {
            'content-type': 'application/json',
            ...headers,
          },
        })
      }

      return new Response('Failed to get friends list', {
        status: 500,
        headers: {
          'content-type': 'text/plain',
          ...headers,
        },
      })
    }

    if (method === 'POST' && pathname === '/api/add') {
      let name, link, avatar, description
      try {
        ;({
          name,
          link,
          avatar = 'https://avatars.githubusercontent.com/u/286696?v=4',
          description = '并没有什么可说的',
        } = await request.json())
      } catch {
        return new Response('Please input name and link', {
          status: 400,
          headers: {
            'content-type': 'text/plain',
            ...headers,
          },
        })
      }
      const RE = /^https:\/\//i
      if (!RE.test(link)) {
        return new Response('Please input a valid link', {
          status: 400,
          headers: {
            'content-type': 'text/plain',
            ...headers,
          },
        })
      }
      const exists = await db
        .prepare('SELECT * FROM friends WHERE url = ?')
        .bind(link)
        .run()

      if (exists.results.length > 0) {
        // throw new Error('Friend already exists')
        return new Response('Friend already exists', {
          status: 400,
          headers: {
            'content-type': 'text/plain',
            ...headers,
          },
        })
      }

      await db
        .prepare(
          'INSERT INTO friends (name, url, avatar, description) VALUES (?, ?, ?, ?)'
        )
        .bind(name, link, avatar, description)
        .run()
      return new Response('Add friend successfully!', {
        headers: {
          'content-type': 'text/plain',
          ...headers,
        },
      })
    }

    return new Response('Not Found', {
      headers: {
        status: 404,
        'content-type': 'text/plain',
        ...headers,
      },
    })
  },
}

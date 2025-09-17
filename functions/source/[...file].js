export async function onRequest(context) {
  const { params, request } = context

  // `params.file` is an array of the path segments after /source/
  const filePath = params.file ? params.file.join('/') : ''

  // Build the GitHub Pages URL
  const proxyUrl = `https://starship-site.github.io/source/${filePath}`

  // Fetch the file from GitHub Pages
  const response = await fetch(proxyUrl, {
    headers: request.headers // optional: forwards client headers
  })

  // Return the response directly
  return response
}

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/arcdb/' // replace REPO_NAME with your GitHub repo name (e.g. '/arcdb/')
    : '/'
}

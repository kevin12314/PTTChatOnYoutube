// eslint-disable-next-line no-undef
GM_xmlhttpRequest({
  method: 'GET',
  url: 'http://127.0.0.1:8080/main.user.js',
  onload: response => {
    // eslint-disable-next-line no-eval
    eval(response.responseText)
  }
})

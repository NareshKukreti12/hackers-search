 function login() {
  // Form fields, see IDs above
  const params = {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
  }

  const http = new XMLHttpRequest()
  http.open('POST', 'auth/login')
  http.setRequestHeader('Content-type', 'application/json')
  http.send(JSON.stringify(params)) // Make sure to stringify
  http.onload = function() {
      // Do whatever with response
      let Result=JSON.parse(http.response);
      console.log(Result);
  }
}
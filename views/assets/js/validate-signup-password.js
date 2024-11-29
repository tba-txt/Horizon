document
  .getElementById('signupForm')
  .addEventListener('submit', validatePassword)

document
  .getElementById('resetPasswordForm')
  .addEventListener('submit', validatePassword)

function validatePassword(event) {
  let senha = document.getElementById('senha').value
  let confirmarSenha = document.getElementById('confirmarSenha').value
  let senhaError = document.getElementById('senhaError')
  let confirmarSenhaError = document.getElementById('confirmarSenhaError')

  let passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/

  let valid = true

  senhaError.textContent = ''
  confirmarSenhaError.textContent = ''

  if (!passwordRegex.test(senha)) {
    senhaError.textContent =
      'A senha deve ter 8+ caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.'
    valid = false
  }

  if (senha !== confirmarSenha) {
    confirmarSenhaError.textContent = 'As senhas não correspondem.'
    valid = false
  }

  if (!valid) {
    event.preventDefault()
  }
}

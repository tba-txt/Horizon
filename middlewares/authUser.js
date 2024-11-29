module.exports = function (req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login')
  }
  next() // Usuário autenticado, permite o acesso
}

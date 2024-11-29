module.exports = function (req, res, next) {
  if (!req.session.collectionPointId) {
    return res.redirect('/collection-point/login')
  }
  next() // Collection Point autenticado, permite o acesso
}

// middleware/auth.js
function ensureHospital(req, res, next) {
    if (req.user && req.user.role === 'hospital') {
      return next();
    }
    res.redirect('/login'); // Redireciona para login se não for hospital
  }
  
  module.exports = { ensureHospital };
  
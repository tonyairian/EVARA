const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

const verifyLoginAjax = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.json({ loggedIn: false });
  }
};

module.exports = {
  verifyLogin,
  verifyLoginAjax,
};

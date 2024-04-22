var express = require("express");
const usermodel = require("./users");
const postmodel = require("./posts");
const passport = require("passport");
const Strategy = require("passport-local");
var router = express.Router();
const upload = require("./multer");

passport.use(new Strategy(usermodel.authenticate()));

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { nav: false });
});

router.get("/register", function (req, res, next) {
  res.render("register", { nav: false });
});

router.post("/register", function (req, res, next) {
  const data = new usermodel({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  });
  usermodel.register(data, req.body.password, function (err, user) {
    if (err) {
      // Handle registration error
      return res.status(400).json({ error: err.message });
    }

    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await usermodel
    .findOne({
      username: req.session.passport.user,
    })
    .populate("posts");
  console.log(user);
  res.render("profile", { user, nav: true });
});

router.get("/addpost", isLoggedIn, async function (req, res, next) {
  const user = await usermodel.findOne({
    username: req.session.passport.user,
  });
  res.render("addpost", { user, nav: true });
});

router.get("/feed", isLoggedIn, async function (req, res, next) {
  const user = await usermodel.findOne({
    username: req.session.passport.user,
  });
  const posts = await postmodel.find().populate("user");
  res.render("feed", { user, posts, nav: true });
});

router.post(
  "/createpost",
  isLoggedIn,
  upload.single("postimg"),
  async function (req, res, next) {
    const user = await usermodel.findOne({
      username: req.session.passport.user,
    });
    const post = await postmodel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
  }
);

router.post(
  "/fileupload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res, next) {
    const user = await usermodel.findOne({
      username: req.session.passport.user,
    });
    user.profileImg = req.file.filename;
    await user.save();
    res.redirect("/profile");
  }
);

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/",
    successRedirect: "/profile",
  }),
  function (req, res, next) {}
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

module.exports = router;

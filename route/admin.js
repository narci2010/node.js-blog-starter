/**
 * /routes/admin.js
 */

var adminConfig = require('../config').adminConfig;

var Admin = require('../models/admin');

var util = require('../libs/util');

exports.home = function(req, res, next) {
  var data = {
    title: adminConfig.pageTitle
  }

  res.render('admin/home', data);
};

exports.pageIndex = function(req, res, next) {
  var data = {
    title: adminConfig.pageTitle
  }

  res.render('admin/page/index', data);
};

exports.pageEdit = function(req, res, next) {
  var data = {
    title: adminConfig.pageTitle
  }

  res.render('admin/page/edit', data);
};

exports.pageWrite = function(req, res, next) {
  var data = {
    title: adminConfig.pageTitle
  }

  res.render('admin/page/write', data);
};

exports.postIndex = function(req, res, next) {
  var data = {
    title: adminConfig.pageTitle
  }

  res.render('admin/post/index', data);
};

exports.postEdit = function(req, res, next) {
  var data = {
    title: adminConfig.pageTitle
  }

  res.render('admin/post/edit', data);
};

exports.postWrite = function(req, res, next) {
  var data = {
    title: adminConfig.pageTitle
  }

  res.render('admin/post/write', data);
};

exports.commentIndex = function(req, res, next) {
  var data = {
    title: adminConfig.pageTitle
  }

  res.render('admin/comment/index', data);
};

exports.verifyAkismet  = function(req, res, next) {
  var data = {
    title: adminConfig.pageTitle
  }

  res.render('admin/verifyAkismet', data);
};

exports.install = function(req, res, next) {
  var data = {
    title: adminConfig.pageTitle
  }

  res.render('admin/install', data);
};

/**
 * 登陆页
 */
exports.login = function(req, res, next) {
  // 已登录则重定向到home
  if (hasLogin(req)) {
    var moment = require('moment');
    console.log(moment('2014-03-25T11:12:12.697Z').format('YYYY-MM-DD-HH-mm-dd'));
    return res.redirect('/admin/home');
  }

  var data = {
    title: adminConfig.pageTitle
  }

  res.render('admin/login', data);
};

/**
 * 处理登录
 */
exports.doLogin = function(req, res, exceptionHandler) {
  var loginname = req.body.loginname.trim();
  var password = req.body.password.trim();
  var admin = new Admin({ loginname: loginname,
                          password: password });

  admin.validate(function(err) {
    if (err) {
      var messages = [];
      for (var error in err.errors) {
        messages.push(err.errors[error].message);
      }

      var data = { messages: messages };
      return renderError(res, '/admin', data);
    }

    // 验证登陆
    Admin.getAuthenticated(loginname, password, function(err, admin, reason) {
      if (err) {
        console.log(err);
        return exceptionHandler().handleError(err, req, res);
      }

      if (null !== admin) {
        // login ok
        generateSession(req, admin);
        res.redirect('/admin/home');
      }

      var reasons = Admin.failedLogin;
      var data = { messages: [] };
      switch (reason) {
        case reasons.NOT_FOUND:
          data.messages.push('Login Name不存在');
          break;

        case reasons.PASSWORD_INCORRECT:
          data.messages.push('Password错误');
          break;

        case reasons.MAX_LOGIN_ATTEMPTS:
          var hours = adminConfig.lockedExpire / 3600000;
          data.messages.push('登录已被限制，请' + hours + '小时后再尝试登录');
          break;
      }

      return renderError(res, '/admin', data);
    });
  });
};

/**
 * 过滤验证登录
 */
exports.authAdmin = function(req, res, next) {
  if (hasLogin(req)) {
    return next();
  }

  res.redirect('/admin');
};

exports.add = function(req, res, exceptionHandler) {
  if ('' === adminConfig.token
      || !req.params.token
      || req.params.token !== adminConfig.token) {
    return exceptionHandler().handleNotFound(req, res);
  }

  var data = {
    title: adminConfig.pageTitle,
    token: req.params.token
  };

  res.render('admin/add', data);
}

exports.create = function(req, res, exceptionHandler) {
  var token = req.body.token;

  if (token !== adminConfig.token
      || !req.headers['referer']) {
    return exceptionHandler().handleNotFound(req, res);
  }

  var admin = new Admin({ loginname: req.body.loginname,
                          password: req.body.password });

  admin.validate(function(err) {
    if (err) {
      // admin invalidate
      var messages = [];
      for (var error in err.errors) {
        messages.push(err.errors[error].message);
      }

      var data = { messages: messages };
      return renderError(res, '/admin/add/' + token, data);
    }

    // save admin
    admin.save(function(err) {
      if (err) {
        return exceptionHandler().handleError(err, req, res);
      }

      res.redirect('/admin');
    });
  });
}

/**
 * 验证是否已登录
 * @return boolean
 */
var hasLogin = function(req) {
  return (req.session.admin
          && req.session.authKey
          && req.session.authKey === generateAuthKey(req.session.admin));
};

/**
 * 数据错误页
 * @param  Response res
 * @param  string back 返回页面
 * @param  Object data 错误数据
 * @return
 */
var renderError = function(res, back, data) {
  data.messages = data.messages || '数据错误';
  data.back = back || '/';

  return res.render('admin/public/error', data);
}

/**
 * 生成session
 * @param  Request req
 * @param  Admin admin
 * @return
 */
var generateSession = function(req, admin) {
  req.session.authKey = generateAuthKey(admin);
  req.session.admin = admin;
}

/**
 * 生成auth key
 * @param  Admin admin
 * @return string
 */
var generateAuthKey = function(admin) {
  return util.md5(admin.loginname
                  + adminConfig.authKey
                  + admin.password);
}

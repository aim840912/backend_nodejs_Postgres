const FacebookStrategy = require('passport-facebook').Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy
const bcrypt = require('bcryptjs')

const dbQuery = require('../db/dbQuery')

const checkUserInSQL = async email => {
  const loginUserQuery = 'SELECT * FROM users WHERE email = $1'
  try {
    const { rows } = await dbQuery.query(loginUserQuery, [email])
    const dbResponse = rows[0]
    if (!dbResponse) {
      return console.log('!dbResponse')
    }
    return console.log('ok')
  } catch (error) {
    return console.log('error')
  }
}

module.exports = passport => {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK,
        profileFields: ['displayName', 'email'],
        passReqToCallback: true
      },
      (req, accessToken, refreshToken, profile, done) => {
        User.findOne({ email: profile._json.email })
          .then(user => {
            // existing user
            if (user) {
              return done(null, user)
            }

            // new user
            const randomPassword = Math.random()
              .toString(36)
              .slice(-8)
            // encrypt password
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(randomPassword, salt, (err, hash) => {
                if (err) throw err
                const newUser = new User({
                  name: profile._json.name,
                  email: profile._json.email,
                  password: hash
                })
                // Save document to user collection
                newUser
                  .save()
                  .then(user => done(null, user))
                  .catch(err => console.error(err))
              })
            })
          })
          .catch(err =>
            done(err, false, req.flash('fail_msg', 'Facebook 驗證失敗'))
          )
      }
    )
  )
}
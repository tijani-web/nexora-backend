import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import pool from "./config/db.js"; 
import dotenv from "dotenv";

dotenv.config();

// Serialize/Deserialize User
passport.serializeUser((user, done) => {
  done(null, user.id); // store user ID in session
});

passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
    done(null, res.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      callbackURL: process.env.AUTH_GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const res = await pool.query("SELECT * FROM users WHERE google_id=$1", [
          profile.id,
        ]);

        if (res.rows.length) {
          return done(null, res.rows[0]);
        } else {
          // Get avatar from Google
          const googleAvatar = profile.photos?.[0]?.value || null;
          
          const newUser = await pool.query(
            "INSERT INTO users (name, email, google_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *",
            [profile.displayName, profile.emails[0].value, profile.id, googleAvatar]
          );
          return done(null, newUser.rows[0]);
        }
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      callbackURL: process.env.AUTH_GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const res = await pool.query("SELECT * FROM users WHERE github_id=$1", [
          profile.id,
        ]);

        if (res.rows.length) {
          return done(null, res.rows[0]);
        } else {
          // Get avatar from GitHub
          const githubAvatar = profile.photos?.[0]?.value || null;
          
          const newUser = await pool.query(
            "INSERT INTO users (name, email, github_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *",
            [
              profile.displayName,
              profile.emails?.[0]?.value || null,
              profile.id,
              githubAvatar
            ]
          );
          return done(null, newUser.rows[0]);
        }
      } catch (err) {
        done(err, null);
      }
    }
  )
);

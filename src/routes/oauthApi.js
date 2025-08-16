import express from "express";
import passport from "passport";
import { generateJWT } from "../helpers/jwtHelper.js";

const oauthRouter = express.Router();

// Redirect to Google
oauthRouter.get('/api/auth/google', passport.authenticate("google", {
    scope: ["profile", "email"]
}));

// Callback from Google
oauthRouter.get('/api/auth/google/callback',
    passport.authenticate("google", { failureRedirect: '/login' }),
    (req, res) => {
        // Login success using google
        const token = generateJWT(req.user);
        res.status(201).json({
            success: true,
            message: "Authentication with Google successful",
            data: {
                id: req.user.id,
                fullname: req.user.fullname,
                username: req.user.username,
                email: req.user.email,
                profile_picture: req.user.profile_picture
            },
            token: token,
        });
    }
);

// Redirect to Facebook
oauthRouter.get('/api/auth/facebook', passport.authenticate("facebook", {
    scope: ['email']
}));

// Callback from Facebook
oauthRouter.get('/api/auth/google/callback',
    passport.authenticate("facebook", { failureRedirect: '/login' }),
    (req, res) => {
        // Login success using facebook
        const token = generateJWT(req.user);
        res.status(201).json({
            success: true,
            message: "Authentication with Facebook successful",
            data: {
                id: req.user.id,
                fullname: req.user.fullname,
                username: req.user.username,
                email: req.user.email,
                profile_picture: req.user.profile_picture
            },
            token: token,
        });
    }
);

// Redirect to X (Twitter)
oauthRouter.get('/api/auth/twitter', passport.authenticate("twitter"));

// Callback from Twitter
oauthRouter.get('/api/auth/twitter/callback',
    passport.authenticate("twitter", { failureRedirect: '/login' }),
    (req, res) => {
        const token = generateJWT(req.user);
        res.status(201).json({
            success: true,
            message: "Authentication with Twitter successful",
            data: {
                id: req.user.id,
                fullname: req.user.fullname,
                username: req.user.username,
                email: req.user.email,
                profile_picture: req.user.profile_picture
            },
            token: token,
        });
    }
);

export { oauthRouter }
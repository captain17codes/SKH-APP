import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { userModel } from '../models/user.model.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
    callbackURL: '/api/auth/google/callback',
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // The role comes from the initial auth request (e.g. state param, or stored in session/cookie if available)
      // We can use the state param to pass the role.
      let role = 'Citizen'; // default
      if (req.query.state) {
        try {
          const stateObj = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
          if (stateObj.role) role = stateObj.role;
        } catch (e) {
          console.warn('Failed to parse state param in Google callback');
        }
      }

      let user = userModel.findUserByGoogleId(profile.id);
      
      if (!user) {
        // Find by email? If they already exist by email, link them?
        // Prompt says: "treat them as separate accounts for now unless the phone number is already attached to the Google account. I will defer auto-linking".
        // We will just create a new one based on google id.
        user = userModel.createUser({
          name: profile.displayName,
          email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
          google_id: profile.id,
          role: role,
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

export default passport;

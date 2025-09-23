import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

class AuthService {
  generateAccessToken(userId) {
    return jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
  }

  generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  async createTokens(userId, deviceInfo = 'Unknown') {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken();
    
    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: {
          token: refreshToken,
          expiresAt,
          deviceInfo,
          createdAt: new Date()
        }
      },
      lastActive: new Date()
    });

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken) {
    const user = await User.findOne({
      'refreshTokens.token': refreshToken,
      'refreshTokens.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(user._id);
    
    // Update last active
    await User.findByIdAndUpdate(user._id, {
      lastActive: new Date()
    });

    return { accessToken, user };
  }

  async revokeRefreshToken(userId, refreshToken) {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token: refreshToken } }
    });
  }

  async revokeAllRefreshTokens(userId) {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] }
    });
  }

  async cleanupExpiredTokens() {
    const result = await User.updateMany(
      {},
      {
        $pull: {
          refreshTokens: {
            expiresAt: { $lt: new Date() }
          }
        }
      }
    );
    return result;
  }
}

export default new AuthService();
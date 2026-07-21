const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

function flattenPermissions(roles = []) {
  const codes = new Set();
  roles.forEach((role) => {
    (role.permissions || []).forEach((perm) => {
      if (perm && perm.code) codes.add(perm.code);
    });
  });
  return Array.from(codes);
}

const authService = {
  async login(username, password) {
    const user = await userRepository.findByUsernameWithPassword(username);

    // Same generic error for "not found", "wrong password", and "inactive/locked"
    // so we don't leak which part of the login failed.
    if (!user || user.status !== 'active') {
      throw new AppError('Invalid username or password', 401);
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid username or password', 401);
    }

    const roleNames = (user.roles || []).map((r) => r.name);
    const permissionCodes = flattenPermissions(user.roles);

    const token = signToken({
      sub: user._id.toString(),
      username: user.username,
      roles: roleNames,
      permissions: permissionCodes,
    });

    await userRepository.touchLastLogin(user._id);

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        roles: roleNames,
        permissions: permissionCodes,
      },
    };
  },

  async register({ username, email, displayName, password, roles }) {
    const existing = await userRepository.findByUsername(username);
    if (existing) {
      throw new AppError('Username already exists', 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await userRepository.create({
      username,
      email,
      displayName,
      passwordHash,
      roles: roles || [],
    });

    return userRepository.findById(user._id);
  },

  async me(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const roleNames = (user.roles || []).map((r) => r.name);
    const permissionCodes = flattenPermissions(user.roles);

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      roles: roleNames,
      permissions: permissionCodes,
    };
  },
};

module.exports = authService;

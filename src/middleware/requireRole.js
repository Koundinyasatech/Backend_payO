
module.exports = (...allowedRoles) => (req, res, next) => {
  const role = req.adminRole;

  if (!role) {
    return res.status(403).json({
      success: false,
      message: "Access denied. No admin role assigned to this account. Contact Super Admin.",
    });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Your role "${role}" is not permitted for this action.`,
    });
  }

  next();
};
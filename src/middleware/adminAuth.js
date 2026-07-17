module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required",
    });
  }

  const adminSession = authHeader.split(" ")[1];

  req.adminSession = adminSession;
  req.adminRole = "super_admin";

  next();
};
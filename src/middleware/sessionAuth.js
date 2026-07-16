module.exports = (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Authorization header missing or invalid");
      return res.status(401).json({
        status: "401",
        message: "Session token is required."
      });
    }

    const sessionToken = authHeader.split(" ")[1];

    if (!sessionToken) {
      return res.status(401).json({
        status: "401",
        message: "Invalid session token."
      });
    }

    req.sessionToken = sessionToken;

    next();

  } catch (err) {

    return res.status(500).json({
      status: "500",
      message: "Session authentication failed."
    });

  }
};
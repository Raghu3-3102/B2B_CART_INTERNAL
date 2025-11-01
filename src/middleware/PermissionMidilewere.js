export const permissionMiddleware = () => {
  return (req, res, next) => {
    const role = req.role; // set in authMiddleware
    const user = req.user;

    if (role === "admin") return next(); // admin has full access

    // Check if user has permission for this page/action
    if (user.role === "admin") {
      return next();
    }

    return res.status(403).json({
      message: "You do not have permission to access this resource",
      success: false
    });
  };
};

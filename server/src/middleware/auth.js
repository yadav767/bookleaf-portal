import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "You are not logged in" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: payload.id, role: payload.role, name: payload.name };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Use after requireAuth: requireRole("admin")
export function requireRole(...roles) {
  return (req, res, next) => {

    if (!roles.includes(req.user.role)) {

      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
  };
}

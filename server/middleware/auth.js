export function attachCurrentUser(req, _res, next) {
  const role = req.header('x-user-role') === 'premium' ? 'premium' : 'free';

  req.user = {
    id: req.header('x-user-id') || 'demo-owner',
    role
  };

  next();
}

export function requirePremium(req, res, next) {
  if (req.user.role !== 'premium') {
    return res.status(403).json({ message: 'Premium plan required for custom branding.' });
  }

  next();
}

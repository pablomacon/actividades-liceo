export function setCors(res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.ALLOWED_ORIGIN || "*",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}

export function sendJson(res, statusCode, data) {
  return res.status(statusCode).json(data);
}

export function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    error: message,
  });
}

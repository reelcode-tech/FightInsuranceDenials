export default function handler(_req, res) {
  res.status(200).json({
    status: 'ok',
    now: new Date().toISOString(),
  });
}

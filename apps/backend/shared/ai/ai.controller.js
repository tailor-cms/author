import AIService from './ai.service.ts';

async function generate(req, res) {
  const data = await AIService.generate(req.body);
  res.json({ data });
}

export default {
  generate,
};

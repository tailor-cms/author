import AIService from './ai.service.ts';

async function generate(req, res) {
  const context = req.body;
  const data = await AIService.generate(context);
  res.json({ data });
}

export default {
  generate,
};

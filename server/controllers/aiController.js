const Task = require('../models/Task');
const Project = require('../models/Project');


const generateTasks = async (req, res) => {
  const { prompt, projectId } = req.body;

  if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a productivity expert. Generate a structured task list and roadmap based on the user's goal.
Return ONLY valid JSON with this structure:
{
  "summary": "Brief explanation of the roadmap",
  "tasks": [
    {
      "title": "Task title",
      "description": "What to do",
      "priority": "high|medium|low",
      "status": "todo",
      "estimatedDays": 2,
      "order": 1,
      "tags": ["tag1", "tag2"]
    }
  ]
}
Generate 5-8 practical, actionable tasks ordered logically.`
          },
          {
            role: 'user',
            content: `Generate a task roadmap for: "${prompt}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const cleanJSON = content.replace(/```json\n?|\n?```/g, '').trim();
    const aiResult = JSON.parse(cleanJSON);

    if (projectId) {
      const project = await Project.findOne({ _id: projectId, owner: req.user._id });
      if (!project) return res.status(404).json({ message: 'Project not found' });

      const savedTasks = await Promise.all(
        aiResult.tasks.map(task =>
          Task.create({
            ...task,
            projectId,
            createdBy: req.user._id,
            aiGenerated: true
          })
        )
      );

      return res.json({
        summary: aiResult.summary,
        tasks: savedTasks,
        saved: true
      });
    }

    res.json({ ...aiResult, saved: false });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ message: 'AI generation failed', error: error.message });
  }
};

module.exports = { generateTasks };

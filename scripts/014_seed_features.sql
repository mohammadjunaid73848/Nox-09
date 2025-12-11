-- Seed AI features for "How AI Works" section
INSERT INTO public.ai_features (title, description, category, order_index) VALUES
('Natural Language Processing', 'Advanced NLP algorithms understand context and nuance in human language', 'core', 1),
('Machine Learning', 'Continuous learning from interactions to improve responses', 'core', 2),
('Real-time Web Search', 'Access current information from the internet instantly', 'capability', 1),
('Image Generation', 'Create stunning visuals from text descriptions', 'capability', 2),
('Code Analysis', 'Understand and help with programming in multiple languages', 'capability', 3),
('Multi-model Integration', 'Leverage the best AI models for different tasks', 'core', 3),
('Context Awareness', 'Maintain conversation context for coherent discussions', 'core', 4),
('Safety & Ethics', 'Built-in safeguards to ensure responsible AI usage', 'core', 5);

-- Seed AI models
INSERT INTO public.ai_models (name, description, provider, capabilities, order_index) VALUES
('GPT-4', 'Advanced language model with superior reasoning', 'OpenAI', ARRAY['text', 'reasoning', 'analysis'], 1),
('Claude 3', 'Constitutional AI with strong safety features', 'Anthropic', ARRAY['text', 'analysis', 'coding'], 2),
('Grok', 'Real-time information with witty responses', 'xAI', ARRAY['text', 'web-search', 'reasoning'], 3),
('Llama 2', 'Open-source model for diverse applications', 'Meta', ARRAY['text', 'coding', 'analysis'], 4),
('Gemini', 'Multimodal AI with vision capabilities', 'Google', ARRAY['text', 'vision', 'analysis'], 5);

-- Seed feature showcase
INSERT INTO public.feature_showcase (title, description, feature_type, order_index) VALUES
('Instant Answers', 'Get accurate answers to any question in seconds', 'speed', 1),
('Code Assistance', 'Write better code with AI-powered suggestions', 'coding', 2),
('Creative Writing', 'Generate creative content for any purpose', 'creativity', 3),
('Research Helper', 'Summarize and analyze complex information', 'research', 4),
('Learning Companion', 'Understand difficult concepts with clear explanations', 'education', 5),
('Problem Solver', 'Break down complex problems into manageable steps', 'problem-solving', 6);

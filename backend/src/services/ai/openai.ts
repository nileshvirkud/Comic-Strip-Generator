import OpenAI from 'openai';
import { config } from '../../utils/config';
import { AIServiceError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.openai.apiKey,
    });
  }

  async generateScript(prompt: string, genre: string, panelCount: number): Promise<{
    title: string;
    panels: Array<{
      panelNumber: number;
      sceneDescription: string;
      dialog: string;
      characters: string[];
      midjourneyPrompt: string;
    }>;
  }> {
    try {
      const systemPrompt = `You are a comic book writer specializing in ${genre} comics. Create engaging, visually compelling comic scripts that work well in a ${panelCount}-panel format.

Rules:
1. Each panel should have a clear visual scene that can be illustrated
2. Include character dialog that fits speech bubbles
3. Generate Midjourney prompts for consistent character design
4. Keep dialog concise but impactful
5. Ensure good story flow between panels
6. Use consistent character names throughout

Format your response as valid JSON with this structure:
{
  "title": "Comic Title",
  "panels": [
    {
      "panelNumber": 1,
      "sceneDescription": "Description of what's happening in the scene",
      "dialog": "Character dialog for this panel",
      "characters": ["Character1", "Character2"],
      "midjourneyPrompt": "Detailed Midjourney prompt for consistent character design"
    }
  ]
}`;

      const response = await this.client.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a ${panelCount}-panel ${genre} comic based on this prompt: ${prompt}` },
        ],
        max_tokens: config.ai.openai.maxTokens,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIServiceError('No content generated', 'OpenAI');
      }

      try {
        const result = JSON.parse(content);
        logger.info('Comic script generated successfully', { 
          panelCount: result.panels?.length,
          title: result.title 
        });
        return result;
      } catch (parseError) {
        logger.error('Failed to parse OpenAI response', { content, error: parseError });
        throw new AIServiceError('Invalid response format from OpenAI', 'OpenAI');
      }
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      logger.error('OpenAI script generation failed', error);
      throw new AIServiceError(`Script generation failed: ${(error as Error).message}`, 'OpenAI');
    }
  }

  async enhanceMidjourneyPrompt(basePrompt: string, style: string, characterRef?: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert at creating Midjourney prompts for comic book art. 
      
Enhance the given prompt to include:
1. Comic book art style specifications
2. Character consistency elements
3. Proper aspect ratios and technical parameters
4. Style-specific elements for ${style} genre
5. Professional comic book rendering techniques

Return only the enhanced Midjourney prompt, nothing else.`;

      const userPrompt = `Enhance this Midjourney prompt for a ${style} comic:
Base prompt: ${basePrompt}
${characterRef ? `Character reference: ${characterRef}` : ''}

Make it specific for comic book illustration with consistent character design.`;

      const response = await this.client.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const enhancedPrompt = response.choices[0]?.message?.content?.trim();
      if (!enhancedPrompt) {
        throw new AIServiceError('No enhanced prompt generated', 'OpenAI');
      }

      return enhancedPrompt;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      logger.error('Midjourney prompt enhancement failed', error);
      throw new AIServiceError(`Prompt enhancement failed: ${(error as Error).message}`, 'OpenAI');
    }
  }

  async generateCharacterConsistencyPrompt(characters: string[], style: string): Promise<string> {
    try {
      const systemPrompt = `Create a character consistency prompt for Midjourney that ensures the same characters appear consistently across multiple comic panels.

Include:
1. Specific physical descriptions for each character
2. Consistent clothing and appearance details
3. Art style specifications for ${style} genre
4. Technical parameters for comic book illustration

Return only the Midjourney prompt for character consistency.`;

      const response = await this.client.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create character consistency prompt for: ${characters.join(', ')} in ${style} style` },
        ],
        max_tokens: 300,
        temperature: 0.2,
      });

      const consistencyPrompt = response.choices[0]?.message?.content?.trim();
      if (!consistencyPrompt) {
        throw new AIServiceError('No consistency prompt generated', 'OpenAI');
      }

      return consistencyPrompt;
    } catch (error) {
      logger.error('Character consistency prompt generation failed', error);
      throw new AIServiceError(`Consistency prompt failed: ${(error as Error).message}`, 'OpenAI');
    }
  }
}
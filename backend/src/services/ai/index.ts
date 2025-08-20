export { OpenAIService } from './openai';
export { MidjourneyService } from './midjourney';
export { RunwayMLService } from './runwayml';

import { OpenAIService } from './openai';
import { MidjourneyService } from './midjourney';
import { RunwayMLService } from './runwayml';

// Singleton instances
export const openaiService = new OpenAIService();
export const midjourneyService = new MidjourneyService();
export const runwaymlService = new RunwayMLService();
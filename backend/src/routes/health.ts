import express from 'express';
import { Request, Response } from 'express';
import { apiHealthChecker, HealthCheckResult, ServiceHealthStatus } from '../utils/apiHealthCheck';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/health - Full health check for all services
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthResult: HealthCheckResult = await apiHealthChecker.checkAllServices();
    
    const statusCode = healthResult.overall === 'healthy' ? 200 : 
                      healthResult.overall === 'degraded' ? 206 : 503;
    
    res.status(statusCode).json(healthResult);
  } catch (error) {
    logger.error('Health check endpoint error', error);
    res.status(500).json({
      overall: 'unhealthy',
      error: 'Health check system failure',
      timestamp: new Date(),
    });
  }
});

// GET /api/health/quick - Quick health check (just overall status)
router.get('/quick', async (req: Request, res: Response) => {
  try {
    const healthResult = await apiHealthChecker.checkAllServices();
    
    const statusCode = healthResult.overall === 'healthy' ? 200 : 
                      healthResult.overall === 'degraded' ? 206 : 503;
    
    res.status(statusCode).json({
      status: healthResult.overall,
      timestamp: healthResult.timestamp,
      serviceCount: healthResult.services.length,
      healthy: healthResult.services.filter(s => s.status === 'healthy').length,
      degraded: healthResult.services.filter(s => s.status === 'degraded').length,
      unhealthy: healthResult.services.filter(s => s.status === 'unhealthy').length,
    });
  } catch (error) {
    logger.error('Quick health check error', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check system failure',
      timestamp: new Date(),
    });
  }
});

// GET /api/health/service/:serviceName - Check specific service
router.get('/service/:serviceName', async (req: Request, res: Response) => {
  try {
    const { serviceName } = req.params;
    const serviceHealth: ServiceHealthStatus = await apiHealthChecker.checkIndividualService(serviceName);
    
    const statusCode = serviceHealth.status === 'healthy' ? 200 : 
                      serviceHealth.status === 'degraded' ? 206 : 503;
    
    res.status(statusCode).json({
      ...serviceHealth,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Individual service health check error', { service: req.params.serviceName, error });
    res.status(500).json({
      service: req.params.serviceName,
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date(),
    });
  }
});

// GET /api/health/critical - Check only critical services (OpenAI, Database, Redis)
router.get('/critical', async (req: Request, res: Response) => {
  try {
    const criticalServices = ['openai', 'database', 'redis'];
    const healthChecks = await Promise.all(
      criticalServices.map(service => apiHealthChecker.checkIndividualService(service))
    );
    
    const allHealthy = healthChecks.every(check => check.status === 'healthy');
    const anyDegraded = healthChecks.some(check => check.status === 'degraded');
    
    const overall = allHealthy ? 'healthy' : anyDegraded ? 'degraded' : 'unhealthy';
    const statusCode = overall === 'healthy' ? 200 : overall === 'degraded' ? 206 : 503;
    
    res.status(statusCode).json({
      overall,
      services: healthChecks,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Critical services health check error', error);
    res.status(500).json({
      overall: 'unhealthy',
      error: 'Critical services health check failed',
      timestamp: new Date(),
    });
  }
});

// GET /api/health/summary - Detailed summary with recommendations
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const healthResult = await apiHealthChecker.checkAllServices();
    
    const summary = {
      overall: healthResult.overall,
      timestamp: healthResult.timestamp,
      statistics: {
        total: healthResult.services.length,
        healthy: healthResult.services.filter(s => s.status === 'healthy').length,
        degraded: healthResult.services.filter(s => s.status === 'degraded').length,
        unhealthy: healthResult.services.filter(s => s.status === 'unhealthy').length,
      },
      services: healthResult.services,
      recommendations: generateRecommendations(healthResult.services),
      criticalIssues: healthResult.services.filter(s => 
        ['OpenAI', 'Database', 'Redis'].includes(s.service) && s.status === 'unhealthy'
      ),
    };
    
    const statusCode = healthResult.overall === 'healthy' ? 200 : 
                      healthResult.overall === 'degraded' ? 206 : 503;
    
    res.status(statusCode).json(summary);
  } catch (error) {
    logger.error('Health summary endpoint error', error);
    res.status(500).json({
      overall: 'unhealthy',
      error: 'Health summary generation failed',
      timestamp: new Date(),
    });
  }
});

function generateRecommendations(services: ServiceHealthStatus[]): string[] {
  const recommendations: string[] = [];
  
  services.forEach(service => {
    if (service.status === 'unhealthy') {
      if (service.error?.includes('API key not configured') || 
          service.error?.includes('placeholder')) {
        recommendations.push(`Configure valid API key for ${service.service}`);
      } else if (service.error?.includes('authentication failed') || 
                service.error?.includes('Invalid API key')) {
        recommendations.push(`Check and update API credentials for ${service.service}`);
      } else if (service.error?.includes('connection refused') || 
                service.error?.includes('unreachable')) {
        recommendations.push(`Check network connectivity and service availability for ${service.service}`);
      } else if (service.error?.includes('timeout')) {
        recommendations.push(`Check network latency and increase timeout for ${service.service}`);
      }
    } else if (service.status === 'degraded') {
      if (service.error?.includes('Rate limit')) {
        recommendations.push(`Implement rate limiting and backoff strategies for ${service.service}`);
      } else if (service.error?.includes('insufficient permissions')) {
        recommendations.push(`Review and update permissions for ${service.service}`);
      }
    }
  });
  
  // Add general recommendations
  const unhealthyServices = services.filter(s => s.status === 'unhealthy');
  const degradedServices = services.filter(s => s.status === 'degraded');
  
  if (unhealthyServices.length > 0) {
    recommendations.push('Review application logs for detailed error information');
    recommendations.push('Verify all environment variables are properly configured');
  }
  
  if (degradedServices.length > 0) {
    recommendations.push('Monitor service performance and consider implementing circuit breakers');
  }
  
  return [...new Set(recommendations)]; // Remove duplicates
}

export default router;
import OpenAI from 'openai';
import axios from 'axios';
import { Client } from 'pg';
import { createClient } from 'redis';
import AWS from 'aws-sdk';
import { config } from './config';
import { logger } from './logger';

export interface ServiceHealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: any;
}

export interface HealthCheckResult {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: ServiceHealthStatus[];
  timestamp: Date;
}

export class APIHealthChecker {
  async checkAllServices(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    logger.info('Starting comprehensive API health check');

    const healthChecks = await Promise.allSettled([
      this.checkOpenAI(),
      this.checkMidjourney(),
      this.checkRunwayML(),
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAWS(),
    ]);

    const services: ServiceHealthStatus[] = healthChecks.map((result, index) => {
      const serviceNames = ['OpenAI', 'Midjourney', 'RunwayML', 'Database', 'Redis', 'AWS'];
      
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: serviceNames[index],
          status: 'unhealthy',
          error: result.reason?.message || 'Health check failed',
        };
      }
    });

    const overall = this.calculateOverallHealth(services);
    const totalTime = Date.now() - startTime;

    logger.info('API health check completed', {
      overall,
      totalTime,
      serviceCount: services.length,
    });

    return {
      overall,
      services,
      timestamp: new Date(),
    };
  }

  async checkOpenAI(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    try {
      if (!config.ai.openai.apiKey || config.ai.openai.apiKey === 'sk-your-openai-api-key') {
        return {
          service: 'OpenAI',
          status: 'unhealthy',
          error: 'API key not configured or using placeholder value',
        };
      }

      const client = new OpenAI({
        apiKey: config.ai.openai.apiKey,
      });

      // Test with a minimal request to check API key validity
      const response = await client.models.list();
      const responseTime = Date.now() - startTime;

      if (response.data && response.data.length > 0) {
        return {
          service: 'OpenAI',
          status: 'healthy',
          responseTime,
          details: {
            availableModels: response.data.length,
            defaultModel: config.ai.openai.model,
          },
        };
      } else {
        return {
          service: 'OpenAI',
          status: 'degraded',
          responseTime,
          error: 'API accessible but no models available',
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Check for specific OpenAI error types
      if (error?.status === 401) {
        return {
          service: 'OpenAI',
          status: 'unhealthy',
          responseTime,
          error: 'Invalid API key or authentication failed',
        };
      } else if (error?.status === 429) {
        return {
          service: 'OpenAI',
          status: 'degraded',
          responseTime,
          error: 'Rate limit exceeded',
        };
      } else if (error?.status === 503) {
        return {
          service: 'OpenAI',
          status: 'unhealthy',
          responseTime,
          error: 'OpenAI service temporarily unavailable',
        };
      }

      return {
        service: 'OpenAI',
        status: 'unhealthy',
        responseTime,
        error: error?.message || 'Unknown error occurred',
      };
    }
  }

  async checkMidjourney(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    try {
      if (!config.ai.midjourney.apiKey || config.ai.midjourney.apiKey === 'your-midjourney-api-key') {
        return {
          service: 'Midjourney',
          status: 'unhealthy',
          error: 'API key not configured or using placeholder value',
        };
      }

      const response = await axios.get('/health', {
        baseURL: config.ai.midjourney.baseUrl,
        headers: {
          'Authorization': `Bearer ${config.ai.midjourney.apiKey}`,
        },
        timeout: 10000,
      });

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        return {
          service: 'Midjourney',
          status: 'healthy',
          responseTime,
          details: response.data,
        };
      } else {
        return {
          service: 'Midjourney',
          status: 'degraded',
          responseTime,
          error: `Unexpected status code: ${response.status}`,
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return {
            service: 'Midjourney',
            status: 'unhealthy',
            responseTime,
            error: 'Invalid API key or authentication failed',
          };
        } else if (error.response?.status === 429) {
          return {
            service: 'Midjourney',
            status: 'degraded',
            responseTime,
            error: 'Rate limit exceeded',
          };
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          return {
            service: 'Midjourney',
            status: 'unhealthy',
            responseTime,
            error: 'Service unreachable or timeout',
          };
        }
      }

      return {
        service: 'Midjourney',
        status: 'unhealthy',
        responseTime,
        error: error?.message || 'Unknown error occurred',
      };
    }
  }

  async checkRunwayML(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    try {
      if (!config.ai.runwayml.apiKey || config.ai.runwayml.apiKey === 'your-runwayml-api-key') {
        return {
          service: 'RunwayML',
          status: 'unhealthy',
          error: 'API key not configured or using placeholder value',
        };
      }

      const response = await axios.get('/health', {
        baseURL: config.ai.runwayml.baseUrl,
        headers: {
          'Authorization': `Bearer ${config.ai.runwayml.apiKey}`,
        },
        timeout: 10000,
      });

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        return {
          service: 'RunwayML',
          status: 'healthy',
          responseTime,
          details: response.data,
        };
      } else {
        return {
          service: 'RunwayML',
          status: 'degraded',
          responseTime,
          error: `Unexpected status code: ${response.status}`,
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return {
            service: 'RunwayML',
            status: 'unhealthy',
            responseTime,
            error: 'Invalid API key or authentication failed',
          };
        } else if (error.response?.status === 429) {
          return {
            service: 'RunwayML',
            status: 'degraded',
            responseTime,
            error: 'Rate limit exceeded',
          };
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          return {
            service: 'RunwayML',
            status: 'unhealthy',
            responseTime,
            error: 'Service unreachable or timeout',
          };
        }
      }

      return {
        service: 'RunwayML',
        status: 'unhealthy',
        responseTime,
        error: error?.message || 'Unknown error occurred',
      };
    }
  }

  async checkDatabase(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    try {
      const client = new Client({
        connectionString: config.database.url,
      });

      await client.connect();
      const result = await client.query('SELECT 1 as health_check');
      await client.end();

      const responseTime = Date.now() - startTime;

      if (result.rows[0]?.health_check === 1) {
        return {
          service: 'Database',
          status: 'healthy',
          responseTime,
          details: {
            connectionString: config.database.url.replace(/:[^:@]*@/, ':***@'), // Hide password
          },
        };
      } else {
        return {
          service: 'Database',
          status: 'degraded',
          responseTime,
          error: 'Unexpected query result',
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      if (error.code === 'ECONNREFUSED') {
        return {
          service: 'Database',
          status: 'unhealthy',
          responseTime,
          error: 'Database connection refused - service may be down',
        };
      } else if (error.code === '28P01') {
        return {
          service: 'Database',
          status: 'unhealthy',
          responseTime,
          error: 'Authentication failed - invalid credentials',
        };
      } else if (error.code === '3D000') {
        return {
          service: 'Database',
          status: 'unhealthy',
          responseTime,
          error: 'Database does not exist',
        };
      }

      return {
        service: 'Database',
        status: 'unhealthy',
        responseTime,
        error: error?.message || 'Unknown database error',
      };
    }
  }

  async checkRedis(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    try {
      const client = createClient({
        url: config.redis.url,
      });

      await client.connect();
      const result = await client.ping();
      await client.quit();

      const responseTime = Date.now() - startTime;

      if (result === 'PONG') {
        return {
          service: 'Redis',
          status: 'healthy',
          responseTime,
          details: {
            connectionString: config.redis.url.replace(/:[^:@]*@/, ':***@'), // Hide password
          },
        };
      } else {
        return {
          service: 'Redis',
          status: 'degraded',
          responseTime,
          error: 'Unexpected ping response',
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      if (error.code === 'ECONNREFUSED') {
        return {
          service: 'Redis',
          status: 'unhealthy',
          responseTime,
          error: 'Redis connection refused - service may be down',
        };
      } else if (error.message?.includes('NOAUTH')) {
        return {
          service: 'Redis',
          status: 'unhealthy',
          responseTime,
          error: 'Authentication required but not provided',
        };
      } else if (error.message?.includes('WRONGPASS')) {
        return {
          service: 'Redis',
          status: 'unhealthy',
          responseTime,
          error: 'Invalid Redis password',
        };
      }

      return {
        service: 'Redis',
        status: 'unhealthy',
        responseTime,
        error: error?.message || 'Unknown Redis error',
      };
    }
  }

  async checkAWS(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    
    try {
      if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
        return {
          service: 'AWS',
          status: 'unhealthy',
          error: 'AWS credentials not configured',
        };
      }

      if (config.aws.accessKeyId === 'your-aws-access-key' || 
          config.aws.secretAccessKey === 'your-aws-secret-key') {
        return {
          service: 'AWS',
          status: 'unhealthy',
          error: 'AWS credentials using placeholder values',
        };
      }

      AWS.config.update({
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        region: config.aws.region,
      });

      const s3 = new AWS.S3();

      // Test S3 access if bucket is configured
      if (config.aws.s3BucketName) {
        await s3.headBucket({ Bucket: config.aws.s3BucketName }).promise();
      } else {
        // Just test credentials by listing buckets
        await s3.listBuckets().promise();
      }

      const responseTime = Date.now() - startTime;

      return {
        service: 'AWS',
        status: 'healthy',
        responseTime,
        details: {
          region: config.aws.region,
          s3Bucket: config.aws.s3BucketName || 'Not configured',
        },
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      if (error.code === 'InvalidAccessKeyId') {
        return {
          service: 'AWS',
          status: 'unhealthy',
          responseTime,
          error: 'Invalid AWS access key ID',
        };
      } else if (error.code === 'SignatureDoesNotMatch') {
        return {
          service: 'AWS',
          status: 'unhealthy',
          responseTime,
          error: 'Invalid AWS secret access key',
        };
      } else if (error.code === 'NoSuchBucket') {
        return {
          service: 'AWS',
          status: 'unhealthy',
          responseTime,
          error: `S3 bucket '${config.aws.s3BucketName}' does not exist`,
        };
      } else if (error.code === 'Forbidden') {
        return {
          service: 'AWS',
          status: 'degraded',
          responseTime,
          error: 'AWS credentials valid but insufficient permissions',
        };
      }

      return {
        service: 'AWS',
        status: 'unhealthy',
        responseTime,
        error: error?.message || 'Unknown AWS error',
      };
    }
  }

  private calculateOverallHealth(services: ServiceHealthStatus[]): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    // If any critical services are unhealthy, overall is unhealthy
    const criticalServices = ['OpenAI', 'Database', 'Redis'];
    const criticalUnhealthy = services.filter(s => 
      criticalServices.includes(s.service) && s.status === 'unhealthy'
    );

    if (criticalUnhealthy.length > 0) {
      return 'unhealthy';
    }

    // If more than half of services are unhealthy
    if (unhealthyCount > services.length / 2) {
      return 'unhealthy';
    }

    // If any services are degraded or some are unhealthy
    if (degradedCount > 0 || unhealthyCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  async checkIndividualService(serviceName: string): Promise<ServiceHealthStatus> {
    switch (serviceName.toLowerCase()) {
      case 'openai':
        return this.checkOpenAI();
      case 'midjourney':
        return this.checkMidjourney();
      case 'runwayml':
        return this.checkRunwayML();
      case 'database':
        return this.checkDatabase();
      case 'redis':
        return this.checkRedis();
      case 'aws':
        return this.checkAWS();
      default:
        return {
          service: serviceName,
          status: 'unhealthy',
          error: 'Unknown service',
        };
    }
  }
}

// Export singleton instance
export const apiHealthChecker = new APIHealthChecker();
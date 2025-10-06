import { Injectable, Logger } from '@nestjs/common';
import { MiddlewareLoaderService } from './middleware-loader.service';

/**
 * Service for visualizing and debugging the middleware execution flow
 */
@Injectable()
export class MiddlewareVisualizerService {
  private readonly logger = new Logger(MiddlewareVisualizerService.name);

  constructor(private readonly middlewareLoader: MiddlewareLoaderService) {}

  /**
   * Generate a text-based visualization of the middleware chain
   */
  visualizeMiddlewareChain(): string {
    const middlewares = this.middlewareLoader.getMiddlewares();
    
    if (middlewares.length === 0) {
      return 'No middleware registered';
    }
    
    // Generate middleware chain visualization
    let output = '\n=== MIDDLEWARE EXECUTION CHAIN ===\n\n';
    
    const enabledMiddlewares = middlewares
      .filter(m => m.enabled)
      .sort((a, b) => a.priority - b.priority);
      
    const disabledMiddlewares = middlewares
      .filter(m => !m.enabled)
      .sort((a, b) => a.priority - b.priority);
    
    // Display enabled middlewares
    output += 'EXECUTION ORDER:\n';
    enabledMiddlewares.forEach((middleware, index) => {
      output += `${index + 1}. [${middleware.priority}] ${middleware.name}\n`;
      
      // Add connection lines between middleware
      if (index < enabledMiddlewares.length - 1) {
        output += '   |\n   ▼\n';
      }
    });
    
    // Display disabled middlewares
    if (disabledMiddlewares.length > 0) {
      output += '\nDISABLED MIDDLEWARE:\n';
      disabledMiddlewares.forEach((middleware) => {
        output += `• [${middleware.priority}] ${middleware.name}\n`;
      });
    }
    
    output += '\n=================================\n';
    
    return output;
  }
  
  /**
   * Print the middleware chain visualization to the console
   */
  logMiddlewareChain(): void {
    const visualization = this.visualizeMiddlewareChain();
    console.log(visualization);
  }
  
  /**
   * Get statistics about the middleware
   */
  getMiddlewareStatistics(): Record<string, any> {
    const middlewares = this.middlewareLoader.getMiddlewares();
    
    return {
      total: middlewares.length,
      enabled: middlewares.filter(m => m.enabled).length,
      disabled: middlewares.filter(m => !m.enabled).length,
      byPriority: this.countByPriority(middlewares),
      averagePriority: this.calculateAveragePriority(middlewares)
    };
  }
  
  /**
   * Count middleware by priority range
   */
  private countByPriority(middlewares: any[]): Record<string, number> {
    const ranges = {
      'critical (0-10)': 0,
      'high (11-30)': 0,
      'medium (31-50)': 0,
      'low (51-100)': 0,
      'lowest (>100)': 0
    };
    
    middlewares.forEach(middleware => {
      const priority = middleware.priority;
      
      if (priority <= 10) ranges['critical (0-10)']++;
      else if (priority <= 30) ranges['high (11-30)']++;
      else if (priority <= 50) ranges['medium (31-50)']++;
      else if (priority <= 100) ranges['low (51-100)']++;
      else ranges['lowest (>100)']++;
    });
    
    return ranges;
  }
  
  /**
   * Calculate the average priority of all middleware
   */
  private calculateAveragePriority(middlewares: any[]): number {
    if (middlewares.length === 0) return 0;
    
    const sum = middlewares.reduce((acc, middleware) => acc + middleware.priority, 0);
    return Math.round(sum / middlewares.length);
  }
}

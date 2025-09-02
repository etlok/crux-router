
import { RedisService } from 'src/redis/redis.service';
import { Logger, UseGuards, Inject, Injectable } from '@nestjs/common';

// Add ClientAuthService for validating client IDs
@Injectable()
export class ClientAuthService {
  private readonly validClients = new Set<string>();
  private readonly logger = new Logger(ClientAuthService.name);

  constructor(private readonly redisService: RedisService) {
    // Load valid client IDs from Redis or other source on startup
    this.loadValidClients();
  }

  private async loadValidClients() {
    try {
      // Example: Load from Redis
      const clientsStr = await this.redisService.get('valid_client_ids');
      if (clientsStr) {
        const clients = JSON.parse(clientsStr);
        clients.forEach(id => this.validClients.add(id));
      }
      this.logger.log(`Loaded ${this.validClients.size} valid client IDs`);
    } catch (error) {
      this.logger.error(`Failed to load valid clients: ${error.message}`);
    }
  }

  isValidClient(clientId: string): boolean {
    // In production, this might check against a database or auth service
    return this.validClients.has(clientId);
  }

  // For demo purposes, add a client ID
  addValidClient(clientId: string) {
    this.validClients.add(clientId);
    this.logger.log(`Added valid client ID: ${clientId}`);
    // Persist to Redis in real implementation
  }
}


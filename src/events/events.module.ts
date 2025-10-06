import { forwardRef, Module } from '@nestjs/common';
import { EventProcessorService } from './event-processor.service';
import { MiddlewareModule } from '../middleware/middleware.module';
import { RouterModule } from 'src/router/router.module';
import { RouterService } from 'src/router/router.service';
import { WorkerLogEmitterService } from './worker-log-emitter.service';

@Module({
  imports: [MiddlewareModule, forwardRef(() => RouterModule)], // Use forwardRef to avoid circular dependency
  providers: [EventProcessorService, WorkerLogEmitterService], // Remove RouterService from here as it will be imported
  exports: [EventProcessorService, WorkerLogEmitterService],
})
export class EventsModule {}

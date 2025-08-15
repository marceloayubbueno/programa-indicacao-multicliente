import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppQueueService } from './whatsapp-queue.service';
import { WhatsAppQueueController } from './whatsapp-queue.controller';
import { WhatsAppQueue, WhatsAppQueueSchema } from './entities/whatsapp-queue.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppQueue.name, schema: WhatsAppQueueSchema },
    ]),
  ],
  controllers: [WhatsAppQueueController],
  providers: [WhatsAppQueueService],
  exports: [WhatsAppQueueService],
})
export class WhatsAppQueueModule {}

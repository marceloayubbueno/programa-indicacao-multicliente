import { PartialType } from '@nestjs/mapped-types';
import { CreateQueueMessageDto } from './create-queue-message.dto';

export class UpdateQueueMessageDto extends PartialType(CreateQueueMessageDto) {}

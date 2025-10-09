import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ActionDto } from './action.dto';

export class EventConfigDto {
  @IsString()
  @IsNotEmpty()
  websocket_method: string;
}

export class EventDto {
  @IsString()
  @IsNotEmpty()
  event: string;

  @IsObject()
  @ValidateNested()
  @Type(() => EventConfigDto)
  config: EventConfigDto;

  @IsArray()
  @IsString({ each: true })
  middleware: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionDto)
  actions: ActionDto[];
}

export class EventsFileDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  events: EventDto[];
}

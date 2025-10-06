import { IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ActionConfigDto {
  @IsString()
  @IsNotEmpty()
  channel_id: string;
}

export class ActionDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  workflow: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ActionConfigDto)
  config: ActionConfigDto;
}

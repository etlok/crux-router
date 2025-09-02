import { IsNotEmpty, IsString, IsObject } from "@nestjs/class-validator";

export class EventPayloadDto {
  @IsNotEmpty()
  @IsString()
  event: string;

  @IsObject()
  payload: Record<string, any>;
}


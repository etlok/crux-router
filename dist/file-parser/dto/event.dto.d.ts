import { ActionDto } from './action.dto';
export declare class EventConfigDto {
    websocket_method: string;
}
export declare class EventDto {
    event: string;
    config: EventConfigDto;
    middleware: string[];
    actions: ActionDto[];
}
export declare class EventsFileDto {
    events: EventDto[];
}

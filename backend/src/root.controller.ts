import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  health() {
    return { message: 'Train Prediction Backend Running', status: 'ok' };
  }
}

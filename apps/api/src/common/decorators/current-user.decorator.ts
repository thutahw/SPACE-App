import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { TokenPayload } from '@space-app/shared';

export const CurrentUser = createParamDecorator(
  (data: keyof TokenPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as TokenPayload;

    return data ? user?.[data] : user;
  }
);

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { ApiResponse } from '@space-app/shared';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the data is already in ApiResponse format, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Wrap in standard response format
        return {
          success: true,
          data,
        };
      })
    );
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { ResponseCode, ResponseWrapper } from "@/types";

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseWrapper<T>>
{
  intercept(
    _: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseWrapper<T>> {
    return next.handle().pipe(
      map((response: unknown) => {
        if (
          response &&
          typeof response === "object" &&
          "data" in response &&
          "code" in response &&
          "message" in response &&
          "status" in response
        ) {
          // Already wrapped, return as is
          return response as ResponseWrapper<T>;
        }
        // Otherwise, wrap with defaults
        return {
          data: response as T,
          code: ResponseCode.OK,
          message: "Request successful",
          status: "success",
        };
      }),
    );
  }
}

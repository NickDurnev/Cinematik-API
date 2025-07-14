import {
  PageMetaData,
  ResponseCode,
  ResponseStatus,
  ResponseWrapper,
} from "@/types";

export function buildResponse<T>({
  data,
  code = ResponseCode.OK,
  message = "Request successful",
  status = "success",
  meta,
}: {
  data: T;
  code?: ResponseCode;
  message?: string;
  status?: ResponseStatus;
  meta?: PageMetaData;
}): ResponseWrapper<T> {
  return { data, code, message, status, meta };
}
